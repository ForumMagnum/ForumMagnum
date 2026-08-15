import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { getItemUrl } from './queue';
import type { PangramWindowScore, ReviewCollectionName, UserContentItem } from '../lib/types';

interface UserContentRow {
  documentId: string;
  collectionName: ReviewCollectionName;
  postedAt: Date;
  title: string | null;
  postTitle: string | null;
  postId: string | null;
  html: string | null;
  baseScore: number | null;
  pangramScore: number | null;
  pangramFractionAi: number | null;
  pangramPrediction: string | null;
  pangramWindowScores: PangramWindowScore[] | null;
  aiChoice: string | null;
  rejected: boolean | null;
  parentCommentHtml: string | null;
  parentCommentAuthor: string | null;
  draft: boolean | null;
  authorIsUnreviewed: boolean | null;
  reviewedByUserId: string | null;
}

function rowStatus(row: UserContentRow): UserContentItem['status'] {
  if (row.rejected) return 'rejected';
  if (row.draft) return 'draft';
  if (row.authorIsUnreviewed || !row.reviewedByUserId) return 'unreviewed';
  return 'approved';
}

export async function getUserContentHistory(userId: string): Promise<UserContentItem[]> {
  const db = getSqlClientOrThrow();
  const rows = await db.any<UserContentRow>(`
    SELECT
      p."_id" AS "documentId",
      'Posts' AS "collectionName",
      p."postedAt",
      p."title",
      NULL AS "postTitle",
      NULL AS "postId",
      r."html",
      p."baseScore",
      ace."pangramScore",
      ace."pangramFractionAi",
      ace."pangramPrediction",
      ace."pangramWindowScores",
      ace."aiChoice",
      p."rejected",
      NULL AS "parentCommentHtml",
      NULL AS "parentCommentAuthor",
      p."draft",
      p."authorIsUnreviewed",
      p."reviewedByUserId"
    FROM "Posts" p
    LEFT JOIN "Revisions" r ON r."_id" = p."contents_latest"
    LEFT JOIN LATERAL (
      SELECT a."pangramScore", a."pangramFractionAi", a."pangramPrediction", a."pangramWindowScores", a."aiChoice"
      FROM "AutomatedContentEvaluations" a
      WHERE a."revisionId" = p."contents_latest"
      ORDER BY a."createdAt" DESC
      LIMIT 1
    ) ace ON TRUE
    WHERE p."userId" = $(userId)
      AND p."deletedDraft" IS NOT TRUE
      AND (p."draft" IS NOT TRUE OR p."wasEverUndrafted" IS TRUE OR p."rejected" IS TRUE)
    UNION ALL
    SELECT
      c."_id",
      'Comments',
      c."postedAt",
      NULL,
      post."title",
      c."postId",
      r."html",
      c."baseScore",
      ace."pangramScore",
      ace."pangramFractionAi",
      ace."pangramPrediction",
      ace."pangramWindowScores",
      ace."aiChoice",
      c."rejected",
      pr."html",
      pu."displayName",
      FALSE,
      c."authorIsUnreviewed",
      c."reviewedByUserId"
    FROM "Comments" c
    LEFT JOIN "Posts" post ON post."_id" = c."postId"
    LEFT JOIN "Revisions" r ON r."_id" = c."contents_latest"
    LEFT JOIN "Comments" pc ON pc."_id" = c."parentCommentId"
    LEFT JOIN "Revisions" pr ON pr."_id" = pc."contents_latest"
    LEFT JOIN "Users" pu ON pu."_id" = pc."userId"
    LEFT JOIN LATERAL (
      SELECT a."pangramScore", a."pangramFractionAi", a."pangramPrediction", a."pangramWindowScores", a."aiChoice"
      FROM "AutomatedContentEvaluations" a
      WHERE a."revisionId" = c."contents_latest"
      ORDER BY a."createdAt" DESC
      LIMIT 1
    ) ace ON TRUE
    WHERE c."userId" = $(userId)
      AND c."deleted" IS NOT TRUE
    ORDER BY "postedAt" DESC
    LIMIT 100
  `, { userId });

  return rows.map(row => ({
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
    pangramPrediction: row.pangramPrediction,
    pangramWindowScores: row.pangramWindowScores,
    aiChoice: row.aiChoice,
    rejected: row.rejected ?? false,
    itemUrl: getItemUrl(row.collectionName, row.documentId, row.postId),
    parentCommentHtml: row.parentCommentHtml,
    parentCommentAuthor: row.parentCommentAuthor,
    status: rowStatus(row),
  }));
}
