import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { spamRiskScoreThreshold } from '@/lib/collections/users/helpers';
import { getUserReviewGroup } from '@/lib/collections/users/newSchema';
import type { QueueCard, QueueItem, QueueUser, ReviewCollectionName } from '../lib/types';

const QUEUE_USER_LIMIT = 100;

interface QueueItemRow {
  documentId: string;
  collectionName: ReviewCollectionName;
  userId: string;
  postedAt: Date;
  title: string | null;
  postTitle: string | null;
  postId: string | null;
  html: string | null;
  baseScore: number | null;
  pangramScore: number | null;
  pangramFractionAi: number | null;
  aiChoice: string | null;
  rejected: boolean | null;
}

const liveUnreviewedItemsSql = `
  SELECT
    p."_id" AS "documentId",
    'Posts' AS "collectionName",
    p."userId",
    p."postedAt",
    p."title",
    NULL AS "postTitle",
    NULL AS "postId",
    r."html",
    p."baseScore",
    ace."pangramScore",
    ace."pangramFractionAi",
    ace."aiChoice",
    p."rejected"
  FROM "Posts" p
  LEFT JOIN "Revisions" r ON r."_id" = p."contents_latest"
  LEFT JOIN LATERAL (
    SELECT a."pangramScore", a."pangramFractionAi", a."aiChoice"
    FROM "AutomatedContentEvaluations" a
    WHERE a."revisionId" = p."contents_latest"
    ORDER BY a."createdAt" DESC
    LIMIT 1
  ) ace ON TRUE
  WHERE p."userId" = ANY($(userIds)::text[])
    AND p."authorIsUnreviewed" IS TRUE
    AND p."rejected" IS NOT TRUE
    AND p."reviewedByUserId" IS NULL
    AND p."draft" IS NOT TRUE
    AND p."deletedDraft" IS NOT TRUE
  UNION ALL
  SELECT
    c."_id",
    'Comments',
    c."userId",
    c."postedAt",
    NULL,
    post."title",
    c."postId",
    r."html",
    c."baseScore",
    ace."pangramScore",
    ace."pangramFractionAi",
    ace."aiChoice",
    c."rejected"
  FROM "Comments" c
  LEFT JOIN "Posts" post ON post."_id" = c."postId"
  LEFT JOIN "Revisions" r ON r."_id" = c."contents_latest"
  LEFT JOIN LATERAL (
    SELECT a."pangramScore", a."pangramFractionAi", a."aiChoice"
    FROM "AutomatedContentEvaluations" a
    WHERE a."revisionId" = c."contents_latest"
    ORDER BY a."createdAt" DESC
    LIMIT 1
  ) ace ON TRUE
  WHERE c."userId" = ANY($(userIds)::text[])
    AND c."authorIsUnreviewed" IS TRUE
    AND c."rejected" IS NOT TRUE
    AND c."reviewedByUserId" IS NULL
    AND c."deleted" IS NOT TRUE
  ORDER BY "postedAt" ASC, "documentId" ASC
`;

function toQueueItem(row: QueueItemRow): QueueItem {
  return {
    documentId: row.documentId,
    collectionName: row.collectionName,
    postedAt: new Date(row.postedAt).toISOString(),
    title: row.title,
    postTitle: row.postTitle,
    postId: row.postId,
    html: row.html,
    baseScore: row.baseScore,
    pangramScore: row.pangramScore,
    pangramFractionAi: row.pangramFractionAi,
    aiChoice: row.aiChoice,
    rejected: row.rejected ?? false,
  };
}

export async function getLiveUnreviewedItems(userIds: string[]): Promise<Map<string, QueueItem[]>> {
  const itemsByUser = new Map<string, QueueItem[]>(userIds.map(userId => [userId, []]));
  if (!userIds.length) {
    return itemsByUser;
  }
  const db = getSqlClientOrThrow();
  const rows = await db.any<QueueItemRow>(liveUnreviewedItemsSql, { userIds });
  for (const row of rows) {
    itemsByUser.get(row.userId)?.push(toQueueItem(row));
  }
  return itemsByUser;
}

export async function getEarliestUnreviewedItem(userId: string): Promise<{ item: QueueItem | null; remainingCount: number }> {
  const itemsByUser = await getLiveUnreviewedItems([userId]);
  const items = itemsByUser.get(userId) ?? [];
  return { item: items[0] ?? null, remainingCount: items.length };
}

function toQueueUser(user: DbUser, htmlBio: string | null, reviewGroup: 'newContent' | 'offboard'): QueueUser {
  return {
    _id: user._id,
    displayName: user.displayName ?? user.username ?? user._id,
    slug: user.slug ?? user._id,
    createdAt: new Date(user.createdAt).toISOString(),
    karma: user.karma,
    postCount: user.postCount,
    commentCount: user.commentCount,
    htmlBio,
    sunshineFlagged: !!user.sunshineFlagged,
    sunshineNotes: user.sunshineNotes ?? '',
    reviewGroup,
    postingDisabled: !!user.postingDisabled,
    allCommentingDisabled: !!user.allCommentingDisabled,
    conversationsDisabled: !!user.conversationsDisabled,
  };
}

interface QueueUserRow extends DbUser {
  simplemodHtmlBio: string | null;
}

export async function computeQueue(context: ResolverContext): Promise<QueueCard[]> {
  const db = getSqlClientOrThrow();
  const users = await db.any<QueueUserRow>(`
    SELECT u.*, bio."html" AS "simplemodHtmlBio"
    FROM "Users" u
    LEFT JOIN "Revisions" bio ON bio."_id" = u."biography_latest"
    WHERE u."needsReview" IS TRUE
      AND u."banned" IS NULL
      AND u."reviewedByUserId" IS NULL
      AND (u."signUpReCaptchaRating" IS NULL OR u."signUpReCaptchaRating" > $(recaptchaThreshold))
    ORDER BY u."createdAt" ASC
    LIMIT $(limit)
  `, { recaptchaThreshold: spamRiskScoreThreshold * 1.25, limit: QUEUE_USER_LIMIT });

  const reviewGroups = await Promise.all(users.map(user => getUserReviewGroup(context, user)));
  const queueUsers = users
    .map((user, index) => ({ user, reviewGroup: reviewGroups[index] }))
    .filter((entry): entry is { user: QueueUserRow; reviewGroup: 'newContent' | 'offboard' } =>
      entry.reviewGroup === 'newContent' || entry.reviewGroup === 'offboard'
    );

  const userIds = queueUsers.map(entry => entry.user._id);
  const [itemsByUser, rejectedCounts] = await Promise.all([
    getLiveUnreviewedItems(userIds),
    getRejectedContentCountsByCollection(userIds),
  ]);

  const cards: QueueCard[] = [];
  for (const { user, reviewGroup } of queueUsers) {
    const queueUser = toQueueUser(user, user.simplemodHtmlBio, reviewGroup);
    const items = itemsByUser.get(user._id) ?? [];
    if (reviewGroup === 'offboard') {
      const rejected = rejectedCounts.get(user._id) ?? { posts: 0, comments: 0 };
      cards.push({
        type: 'offboard',
        user: queueUser,
        items,
        rejectedPostCount: rejected.posts,
        rejectedCommentCount: rejected.comments,
      });
    } else if (items.length > 0) {
      cards.push({ type: 'content', user: queueUser, item: items[0], remainingCount: items.length });
    } else {
      cards.push({ type: 'wrapup', user: queueUser });
    }
  }
  return cards;
}

async function getRejectedContentCountsByCollection(userIds: string[]): Promise<Map<string, { posts: number; comments: number }>> {
  const counts = new Map<string, { posts: number; comments: number }>();
  if (!userIds.length) {
    return counts;
  }
  const db = getSqlClientOrThrow();
  const rows = await db.any<{ userId: string; postCount: number; commentCount: number }>(`
    SELECT
      "userId",
      COUNT(*) FILTER (WHERE "collectionName" = 'Posts')::int AS "postCount",
      COUNT(*) FILTER (WHERE "collectionName" = 'Comments')::int AS "commentCount"
    FROM (
      SELECT "userId", 'Posts' AS "collectionName" FROM "Posts"
      WHERE "userId" = ANY($(userIds)::text[]) AND "rejected" IS TRUE
      UNION ALL
      SELECT "userId", 'Comments' FROM "Comments"
      WHERE "userId" = ANY($(userIds)::text[]) AND "rejected" IS TRUE
    ) "rejectedContent"
    GROUP BY "userId"
  `, { userIds });
  for (const row of rows) {
    counts.set(row.userId, { posts: row.postCount, comments: row.commentCount });
  }
  return counts;
}
