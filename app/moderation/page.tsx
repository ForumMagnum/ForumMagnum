import React from "react";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { unstable_cache } from 'next/cache';
import ModerationPageContent, {
  ActiveRateLimit,
  ModerationComment,
  ModerationPost,
  ModerationUser,
  ModeratorComment,
  GloballyBannedUser,
} from "./ModerationPageContent";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Moderation Log',
    robots: { index: false },
  });
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const defaultLimit = 20;
  const params = await searchParams;

  // Parse pagination offsets
  const moderatorCommentsOffset = parseInt((params?.moderatorCommentsOffset as string) || '0', 10);
  const activeRateLimitsOffset = parseInt((params?.activeRateLimitsOffset as string) || '0', 10);
  const deletedCommentsOffset = parseInt((params?.deletedCommentsOffset as string) || '0', 10);
  const rejectedPostsOffset = parseInt((params?.rejectedPostsOffset as string) || '0', 10);
  const rejectedCommentsOffset = parseInt((params?.rejectedCommentsOffset as string) || '0', 10);
  const bannedFromPostsOffset = parseInt((params?.bannedFromPostsOffset as string) || '0', 10);
  const bannedFromUsersOffset = parseInt((params?.bannedFromUsersOffset as string) || '0', 10);
  const globallyBannedUsersOffset = parseInt((params?.globallyBannedUsersOffset as string) || '0', 10);

  // Parse toggle flags
  const showExpiredRateLimits = params?.showExpiredRateLimits === 'true';
  const showNewUserRateLimits = params?.showNewUserRateLimits === 'true';
  const showExpiredBans = params?.showExpiredBans === 'true';

  const limit = defaultLimit;
  const db = getSqlClientOrThrow();

  // Include commit SHA in cache keys to invalidate cache on deployments
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev';

  // Fetch all data with caching (30 minute revalidation)
  const getCachedModeratorCommentIds = unstable_cache(
    async () => fetchModeratorCommentIds(db, limit, moderatorCommentsOffset),
    [`moderation-comments-${commitSha}-${limit}-${moderatorCommentsOffset}`],
    { revalidate: 1800, tags: ['moderation-comments'] }
  );

  const getCachedModeratorPosts = unstable_cache(
    async () => fetchModeratorPosts(db),
    [`moderation-posts-${commitSha}`],
    { revalidate: 1800, tags: ['moderation-posts'] }
  );

  const getCachedActiveRateLimits = unstable_cache(
    async () => fetchActiveRateLimits(db, limit, activeRateLimitsOffset, showExpiredRateLimits, showNewUserRateLimits),
    [`moderation-rate-limits-${commitSha}-${limit}-${activeRateLimitsOffset}-${showExpiredRateLimits}-${showNewUserRateLimits}`],
    { revalidate: 1800, tags: ['moderation-rate-limits'] }
  );

  const getCachedDeletedComments = unstable_cache(
    async () => fetchDeletedComments(db, limit, deletedCommentsOffset),
    [`moderation-deleted-comments-${commitSha}-${limit}-${deletedCommentsOffset}`],
    { revalidate: 1800, tags: ['moderation-deleted-comments'] }
  );

  const getCachedRejectedPosts = unstable_cache(
    async () => fetchRejectedPosts(db, limit, rejectedPostsOffset),
    [`moderation-rejected-posts-${commitSha}-${limit}-${rejectedPostsOffset}`],
    { revalidate: 1800, tags: ['moderation-rejected-posts'] }
  );

  const getCachedRejectedComments = unstable_cache(
    async () => fetchRejectedComments(db, limit, rejectedCommentsOffset),
    [`moderation-rejected-comments-${commitSha}-${limit}-${rejectedCommentsOffset}`],
    { revalidate: 1800, tags: ['moderation-rejected-comments'] }
  );

  const getCachedPostsWithBannedUsers = unstable_cache(
    async () => fetchPostsWithBannedUsers(db, limit, bannedFromPostsOffset),
    [`moderation-posts-banned-users-${commitSha}-${limit}-${bannedFromPostsOffset}`],
    { revalidate: 1800, tags: ['moderation-posts-banned-users'] }
  );

  const getCachedUsersWithBannedUsers = unstable_cache(
    async () => fetchUsersWithBannedUsers(db, limit, bannedFromUsersOffset),
    [`moderation-users-banned-users-${commitSha}-${limit}-${bannedFromUsersOffset}`],
    { revalidate: 1800, tags: ['moderation-users-banned-users'] }
  );

  const getCachedGloballyBannedUsers = unstable_cache(
    async () => fetchGloballyBannedUsers(db, limit, globallyBannedUsersOffset, showExpiredBans),
    [`moderation-globally-banned-${commitSha}-${limit}-${globallyBannedUsersOffset}-${showExpiredBans}`],
    { revalidate: 1800, tags: ['moderation-globally-banned'] }
  );

  const { comments: moderatorCommentIds, count: moderatorCommentsCount } = await getCachedModeratorCommentIds();
  const moderatorPosts = await getCachedModeratorPosts();
  const { rateLimits: activeRateLimits, count: activeRateLimitsCount } = await getCachedActiveRateLimits();
  const { comments: deletedComments, count: deletedCommentsCount } = await getCachedDeletedComments();
  const { posts: rejectedPosts, count: rejectedPostsCount } = await getCachedRejectedPosts();
  const { comments: rejectedComments, count: rejectedCommentsCount } = await getCachedRejectedComments();
  const { posts: postsWithBannedUsers, count: postsWithBannedUsersCount } = await getCachedPostsWithBannedUsers();
  const { users: usersWithBannedUsers, count: usersWithBannedUsersCount } = await getCachedUsersWithBannedUsers();
  const { users: globallyBannedUsers, count: globallyBannedUsersCount } = await getCachedGloballyBannedUsers();

  return (
    <RouteRoot>
      <ModerationPageContent
        moderatorCommentIds={moderatorCommentIds}
        moderatorCommentsCount={moderatorCommentsCount}
        moderatorCommentsOffset={moderatorCommentsOffset}
        moderatorPosts={moderatorPosts}
        activeRateLimits={activeRateLimits}
        activeRateLimitsCount={activeRateLimitsCount}
        activeRateLimitsOffset={activeRateLimitsOffset}
        showExpiredRateLimits={showExpiredRateLimits}
        showNewUserRateLimits={showNewUserRateLimits}
        deletedComments={deletedComments}
        deletedCommentsCount={deletedCommentsCount}
        deletedCommentsOffset={deletedCommentsOffset}
        rejectedPosts={rejectedPosts}
        rejectedPostsCount={rejectedPostsCount}
        rejectedPostsOffset={rejectedPostsOffset}
        rejectedComments={rejectedComments}
        rejectedCommentsCount={rejectedCommentsCount}
        rejectedCommentsOffset={rejectedCommentsOffset}
        postsWithBannedUsers={postsWithBannedUsers}
        postsWithBannedUsersCount={postsWithBannedUsersCount}
        postsWithBannedUsersOffset={bannedFromPostsOffset}
        usersWithBannedUsers={usersWithBannedUsers}
        usersWithBannedUsersCount={usersWithBannedUsersCount}
        usersWithBannedUsersOffset={bannedFromUsersOffset}
        globallyBannedUsers={globallyBannedUsers}
        globallyBannedUsersCount={globallyBannedUsersCount}
        globallyBannedUsersOffset={globallyBannedUsersOffset}
        showExpiredBans={showExpiredBans}
        limit={limit}
      />
    </RouteRoot>
  );
}

// Types

type SqlClient = ReturnType<typeof getSqlClientOrThrow>;

type DeletedCommentRow = {
  _id: string;
  userId: string | null;
  postId: string | null;
  deletedDate: Date | null;
  deletedReason: string | null;
  deletedPublic: boolean | null;
  contents: any;
  user__id: string | null;
  user_displayName: string | null;
  user_slug: string | null;
  deletedByUser__id: string | null;
  deletedByUser_displayName: string | null;
  deletedByUser_slug: string | null;
  post__id: string | null;
  post_title: string | null;
  post_slug: string | null;
};

type PostWithBannedUsersRow = {
  _id: string;
  title: string | null;
  slug: string | null;
  userId: string | null;
  createdAt: Date | null;
  user__id: string | null;
  user_displayName: string | null;
  user_slug: string | null;
  bannedUsers: Array<{_id: string; displayName: string; slug: string}> | null;
};

type UserWithBannedUsersRow = {
  _id: string;
  displayName: string | null;
  slug: string | null;
  bannedFrontpageUsers: Array<{_id: string; displayName: string; slug: string}> | null;
  bannedPersonalUsers: Array<{_id: string; displayName: string; slug: string}> | null;
};

type ModeratorPostRow = {
  _id: string;
  title: string | null;
  slug: string | null;
  userId: string | null;
  postedAt: Date | null;
  user__id: string | null;
  user_displayName: string | null;
  user_slug: string | null;
};

type RateLimitRow = {
  userId: string;
  rateLimits: string; // JSON array of rate limits
  mostRecentActivation: Date;
  user__id: string | null;
  user_displayName: string | null;
  user_slug: string | null;
  user_createdAt: Date | null;
  user_karma: number | null;
  user_postCount: number | null;
  user_commentCount: number | null;
};

type RejectedPostRow = {
  _id: string;
  title: string | null;
  slug: string | null;
  userId: string | null;
  postedAt: Date | null;
  rejectedReason: string | null;
  user__id: string | null;
  user_displayName: string | null;
  user_slug: string | null;
  reviewedByUser__id: string | null;
  reviewedByUser_displayName: string | null;
  reviewedByUser_slug: string | null;
};

type RejectedCommentRow = {
  _id: string;
  userId: string | null;
  postId: string | null;
  postedAt: Date | null;
  rejectedReason: string | null;
  contents: any;
  user__id: string | null;
  user_displayName: string | null;
  user_slug: string | null;
  reviewedByUser__id: string | null;
  reviewedByUser_displayName: string | null;
  reviewedByUser_slug: string | null;
  post__id: string | null;
  post_title: string | null;
  post_slug: string | null;
};

type GloballyBannedUserRow = {
  _id: string;
  displayName: string | null;
  slug: string;
  karma: number | null;
  createdAt: Date | null;
  postCount: number | null;
  commentCount: number | null;
  banned: Date | null;
};

// Data fetching functions

async function fetchModeratorCommentIds(db: SqlClient, limit: number, offset: number) {
  const [moderatorCommentIdsData, moderatorCommentsCountResult] = await Promise.all([
    db.manyOrNone<{_id: string}>(`
      SELECT c._id
      FROM "Comments" c
      WHERE c."moderatorHat" = TRUE
      ORDER BY c."postedAt" DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `, [limit, offset]),
    db.one<{count: number}>(`
      SELECT COUNT(*) as count
      FROM "Comments"
      WHERE "moderatorHat" = TRUE
    `)
  ]);

  const comments = moderatorCommentIdsData.map(row => row._id);
  return { comments, count: moderatorCommentsCountResult.count };
}

async function fetchModeratorPosts(db: SqlClient) {
  const moderatorPostsData = await db.manyOrNone<ModeratorPostRow>(`
    SELECT
      p._id, p.title, p.slug, p."userId", p."postedAt",
      u._id as "user__id", u."displayName" as "user_displayName", u.slug as "user_slug"
    FROM "Posts" p
    LEFT JOIN "Users" u ON p."userId" = u._id
    WHERE p."moderatorPost" IS NOT NULL
    ORDER BY p."moderatorPost" ASC NULLS LAST
    LIMIT 10
  `);

  return moderatorPostsData.map(row => ({
    _id: row._id,
    title: row.title ?? '',
    slug: row.slug ?? '',
    userId: row.userId ?? null,
    postedAt: row.postedAt ?? null,
    user: row.user__id && row.user_slug ? { _id: row.user__id, displayName: row.user_displayName ?? null, slug: row.user_slug } : null,
  }));
}

async function fetchActiveRateLimits(db: SqlClient, limit: number, offset: number, showExpiredRateLimits: boolean, showNewUserRateLimits: boolean) {
  const [activeRateLimitsData, activeRateLimitsCountResult] = await Promise.all([
    db.manyOrNone<RateLimitRow>(`
      WITH latest_events AS (
        SELECT DISTINCT ON (e."userId", e.properties->>'rateLimitType', e.properties->>'actionType')
          e."userId",
          e.name,
          e.properties,
          e."createdAt",
          COALESCE((e.properties->>'triggeredAt')::timestamp, e."createdAt") as "triggeredAt"
        FROM "LWEvents" e
        WHERE e.name IN ('rateLimitActivated', 'rateLimitDeactivated')
        ORDER BY e."userId", e.properties->>'rateLimitType', e.properties->>'actionType', e."createdAt" DESC
      ),
      filtered_limits AS (
        SELECT
          le."userId",
          le.name,
          le.properties,
          le."triggeredAt"
        FROM latest_events le
        WHERE
          ${showExpiredRateLimits
            ? `le.name = 'rateLimitDeactivated'`
            : `le.name = 'rateLimitActivated'`
          }
      ),
      users_with_limits AS (
        SELECT
          fl."userId",
          MAX(fl."triggeredAt") as "mostRecentActivation",
          json_agg(
            json_build_object(
              'actionType', fl.properties->>'actionType',
              'rateLimitType', fl.properties->>'rateLimitType',
              'rateLimitCategory', fl.properties->>'rateLimitCategory',
              'itemsPerTimeframe', (fl.properties->>'itemsPerTimeframe')::int,
              'timeframeLength', (fl.properties->>'timeframeLength')::int,
              'timeframeUnit', fl.properties->>'timeframeUnit',
              'rateLimitMessage', fl.properties->>'rateLimitMessage',
              'activatedAt', fl."triggeredAt"
            )
          ) as "rateLimits"
        FROM filtered_limits fl
        GROUP BY fl."userId"
      )
      SELECT
        uwl."userId",
        uwl."rateLimits"::text as "rateLimits",
        uwl."mostRecentActivation",
        u._id as "user__id",
        u."displayName" as "user_displayName",
        u.slug as "user_slug",
        u."createdAt" as "user_createdAt",
        u.karma as "user_karma",
        u."postCount" as "user_postCount",
        u."commentCount" as "user_commentCount"
      FROM users_with_limits uwl
      LEFT JOIN "Users" u ON uwl."userId" = u._id
      ${!showNewUserRateLimits ? `WHERE COALESCE(u."postCount", 0) + COALESCE(u."commentCount", 0) >= 5` : ''}
      ORDER BY uwl."mostRecentActivation" DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]),
    db.one<{count: number}>(`
      WITH latest_events AS (
        SELECT DISTINCT ON (e."userId", e.properties->>'rateLimitType', e.properties->>'actionType')
          e."userId",
          e.name,
          e.properties,
          COALESCE((e.properties->>'triggeredAt')::timestamp, e."createdAt") as "triggeredAt"
        FROM "LWEvents" e
        WHERE e.name IN ('rateLimitActivated', 'rateLimitDeactivated')
        ORDER BY e."userId", e.properties->>'rateLimitType', e.properties->>'actionType', e."createdAt" DESC
      ),
      filtered_limits AS (
        SELECT DISTINCT le."userId"
        FROM latest_events le
        WHERE
          ${showExpiredRateLimits
            ? `le.name = 'rateLimitDeactivated'`
            : `le.name = 'rateLimitActivated'`
          }
      )
      SELECT COUNT(*) as count
      FROM filtered_limits fl
      ${!showNewUserRateLimits ? `
        LEFT JOIN "Users" u ON fl."userId" = u._id
        WHERE COALESCE(u."postCount", 0) + COALESCE(u."commentCount", 0) >= 5
      ` : ''}
    `)
  ]);

  const rateLimits = activeRateLimitsData.map(row => ({
    userId: row.userId,
    rateLimits: JSON.parse(row.rateLimits),
    mostRecentActivation: row.mostRecentActivation,
    user: row.user__id && row.user_slug ? {
      _id: row.user__id,
      displayName: row.user_displayName ?? null,
      slug: row.user_slug,
      createdAt: row.user_createdAt ?? null,
      karma: row.user_karma ?? null,
      postCount: row.user_postCount ?? null,
      commentCount: row.user_commentCount ?? null,
    } : null,
  }));

  return { rateLimits, count: activeRateLimitsCountResult.count };
}

async function fetchDeletedComments(db: SqlClient, limit: number, offset: number) {
  const [deletedCommentsData, deletedCommentsCountResult] = await Promise.all([
    db.manyOrNone<DeletedCommentRow>(`
      SELECT
        c._id, c."userId", c."postId", c."deletedDate", c."deletedReason",
        c."deletedPublic", c.contents,
        u._id as "user__id", u."displayName" as "user_displayName", u.slug as "user_slug",
        du._id as "deletedByUser__id", du."displayName" as "deletedByUser_displayName", du.slug as "deletedByUser_slug",
        p._id as "post__id", p.title as "post_title", p.slug as "post_slug"
      FROM "Comments" c
      LEFT JOIN "Users" u ON c."userId" = u._id
      LEFT JOIN "Users" du ON c."deletedByUserId" = du._id
      LEFT JOIN "Posts" p ON c."postId" = p._id
      WHERE c.deleted = TRUE AND c."deletedPublic" = TRUE
      ORDER BY c."deletedDate" DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `, [limit, offset]),
    db.one<{count: number}>(`
      SELECT COUNT(*) as count
      FROM "Comments"
      WHERE deleted = TRUE AND "deletedPublic" = TRUE
    `)
  ]);

  const comments = deletedCommentsData.map(row => ({
    _id: row._id,
    userId: row.userId ?? null,
    postId: row.postId ?? null,
    deletedDate: row.deletedDate ?? null,
    deletedReason: row.deletedReason ?? null,
    deletedPublic: row.deletedPublic ?? null,
    contents: row.contents,
    user: row.user__id && row.user_slug ? { _id: row.user__id, displayName: row.user_displayName ?? null, slug: row.user_slug } : null,
    deletedByUser: row.deletedByUser__id && row.deletedByUser_slug ? { _id: row.deletedByUser__id, displayName: row.deletedByUser_displayName ?? null, slug: row.deletedByUser_slug } : null,
    post: row.post__id && row.post_slug && row.post_title ? { _id: row.post__id, title: row.post_title, slug: row.post_slug } : null,
  }));

  return { comments, count: deletedCommentsCountResult.count };
}

async function fetchRejectedPosts(db: SqlClient, limit: number, offset: number) {
  const [rejectedPostsData, rejectedPostsCountResult] = await Promise.all([
    db.manyOrNone<RejectedPostRow>(`
      SELECT
        p._id, p.title, p.slug, p."userId", p."postedAt", p."rejectedReason",
        u._id as "user__id", u."displayName" as "user_displayName", u.slug as "user_slug",
        ru._id as "reviewedByUser__id", ru."displayName" as "reviewedByUser_displayName", ru.slug as "reviewedByUser_slug"
      FROM "Posts" p
      LEFT JOIN "Users" u ON p."userId" = u._id
      LEFT JOIN "Users" ru ON p."reviewedByUserId" = ru._id
      WHERE p.rejected = TRUE
      ORDER BY p."postedAt" DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `, [limit, offset]),
    db.one<{count: number}>(`
      SELECT COUNT(*) as count
      FROM "Posts"
      WHERE rejected = TRUE
    `)
  ]);

  const posts = rejectedPostsData.map(row => ({
    _id: row._id,
    title: row.title ?? '',
    slug: row.slug ?? '',
    userId: row.userId ?? null,
    postedAt: row.postedAt ?? null,
    rejectedReason: row.rejectedReason ?? null,
    user: row.user__id && row.user_slug ? { _id: row.user__id, displayName: row.user_displayName ?? null, slug: row.user_slug } : null,
    reviewedByUser: row.reviewedByUser__id && row.reviewedByUser_slug ? { _id: row.reviewedByUser__id, displayName: row.reviewedByUser_displayName ?? null, slug: row.reviewedByUser_slug } : null,
  }));

  return { posts, count: rejectedPostsCountResult.count };
}

async function fetchRejectedComments(db: SqlClient, limit: number, offset: number) {
  const [rejectedCommentsData, rejectedCommentsCountResult] = await Promise.all([
    db.manyOrNone<RejectedCommentRow>(`
      SELECT
        c._id, c."userId", c."postId", c."postedAt", c."rejectedReason", c.contents,
        u._id as "user__id", u."displayName" as "user_displayName", u.slug as "user_slug",
        ru._id as "reviewedByUser__id", ru."displayName" as "reviewedByUser_displayName", ru.slug as "reviewedByUser_slug",
        p._id as "post__id", p.title as "post_title", p.slug as "post_slug"
      FROM "Comments" c
      LEFT JOIN "Users" u ON c."userId" = u._id
      LEFT JOIN "Users" ru ON c."reviewedByUserId" = ru._id
      LEFT JOIN "Posts" p ON c."postId" = p._id
      WHERE c.rejected = TRUE
      ORDER BY c."postedAt" DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `, [limit, offset]),
    db.one<{count: number}>(`
      SELECT COUNT(*) as count
      FROM "Comments"
      WHERE rejected = TRUE
    `)
  ]);

  const comments = rejectedCommentsData.map(row => ({
    _id: row._id,
    userId: row.userId ?? null,
    postId: row.postId ?? null,
    postedAt: row.postedAt ?? null,
    rejectedReason: row.rejectedReason ?? null,
    contents: row.contents,
    user: row.user__id && row.user_slug ? { _id: row.user__id, displayName: row.user_displayName ?? null, slug: row.user_slug } : null,
    reviewedByUser: row.reviewedByUser__id && row.reviewedByUser_slug ? { _id: row.reviewedByUser__id, displayName: row.reviewedByUser_displayName ?? null, slug: row.reviewedByUser_slug } : null,
    post: row.post__id && row.post_slug && row.post_title ? { _id: row.post__id, title: row.post_title, slug: row.post_slug } : null,
  }));

  return { comments, count: rejectedCommentsCountResult.count };
}

async function fetchPostsWithBannedUsers(db: SqlClient, limit: number, offset: number) {
  const [postsWithBannedUsersData, postsWithBannedUsersCountResult] = await Promise.all([
    db.manyOrNone<PostWithBannedUsersRow>(`
      SELECT
        p._id, p.title, p.slug, p."userId", p."createdAt", p."bannedUserIds",
        u._id as "user__id", u."displayName" as "user_displayName", u.slug as "user_slug",
        (
          SELECT json_agg(json_build_object('_id', bu._id, 'displayName', bu."displayName", 'slug', bu.slug))
          FROM unnest(p."bannedUserIds") AS banned_id
          JOIN "Users" bu ON bu._id = banned_id
        ) as "bannedUsers"
      FROM "Posts" p
      LEFT JOIN "Users" u ON p."userId" = u._id
      WHERE p."bannedUserIds" IS NOT NULL AND array_length(p."bannedUserIds", 1) > 0
      ORDER BY p."createdAt" DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]),
    db.one<{count: number}>(`
      SELECT COUNT(*) as count
      FROM "Posts"
      WHERE "bannedUserIds" IS NOT NULL AND array_length("bannedUserIds", 1) > 0
    `)
  ]);

  const posts = postsWithBannedUsersData.map(row => ({
    _id: row._id,
    title: row.title ?? '',
    slug: row.slug ?? '',
    userId: row.userId ?? null,
    createdAt: row.createdAt ?? undefined,
    user: row.user__id && row.user_slug ? { _id: row.user__id, displayName: row.user_displayName ?? null, slug: row.user_slug } : null,
    bannedUsers: row.bannedUsers || [],
  }));

  return { posts, count: postsWithBannedUsersCountResult.count };
}

async function fetchUsersWithBannedUsers(db: SqlClient, limit: number, offset: number) {
  const [usersWithBannedUsersData, usersWithBannedUsersCountResult] = await Promise.all([
    db.manyOrNone<UserWithBannedUsersRow>(`
      SELECT
        u._id, u."displayName", u.slug, u."bannedUserIds", u."bannedPersonalUserIds",
        (
          SELECT json_agg(json_build_object('_id', bfu._id, 'displayName', bfu."displayName", 'slug', bfu.slug))
          FROM unnest(u."bannedUserIds") AS frontpage_id
          JOIN "Users" bfu ON bfu._id = frontpage_id
        ) as "bannedFrontpageUsers",
        (
          SELECT json_agg(json_build_object('_id', bpu._id, 'displayName', bpu."displayName", 'slug', bpu.slug))
          FROM unnest(u."bannedPersonalUserIds") AS personal_id
          JOIN "Users" bpu ON bpu._id = personal_id
        ) as "bannedPersonalUsers"
      FROM "Users" u
      WHERE (u."bannedUserIds" IS NOT NULL AND array_length(u."bannedUserIds", 1) > 0)
         OR (u."bannedPersonalUserIds" IS NOT NULL AND array_length(u."bannedPersonalUserIds", 1) > 0)
      ORDER BY u."createdAt" DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]),
    db.one<{count: number}>(`
      SELECT COUNT(*) as count
      FROM "Users"
      WHERE ("bannedUserIds" IS NOT NULL AND array_length("bannedUserIds", 1) > 0)
         OR ("bannedPersonalUserIds" IS NOT NULL AND array_length("bannedPersonalUserIds", 1) > 0)
    `)
  ]);

  const users = usersWithBannedUsersData.map(row => ({
    _id: row._id,
    displayName: row.displayName ?? null,
    slug: row.slug ?? '',
    bannedFrontpageUsers: row.bannedFrontpageUsers || [],
    bannedPersonalUsers: row.bannedPersonalUsers || [],
  }));

  return { users, count: usersWithBannedUsersCountResult.count };
}

async function fetchGloballyBannedUsers(db: SqlClient, limit: number, offset: number, showExpiredBans: boolean) {
  const [globallyBannedUsersData, globallyBannedUsersCountResult] = await Promise.all([
    db.manyOrNone<GloballyBannedUserRow>(`
      SELECT
        u._id,
        u."displayName",
        u.slug,
        u.karma,
        u."createdAt",
        u."postCount",
        u."commentCount",
        u.banned
      FROM "Users" u
      WHERE u.banned IS NOT NULL
        ${showExpiredBans ? `` : `AND u.banned > NOW()`}
      ORDER BY u.karma DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `, [limit, offset]),
    db.one<{count: number}>(`
      SELECT COUNT(*) as count
      FROM "Users"
      WHERE banned IS NOT NULL
        ${showExpiredBans ? `` : `AND banned > NOW()`}
    `)
  ]);

  return { users: globallyBannedUsersData, count: globallyBannedUsersCountResult.count };
}
