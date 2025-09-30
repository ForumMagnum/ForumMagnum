import React from "react";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
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

type DbRow = {
  _id: string;
  userId?: string | null;
  postId?: string | null;
  deletedDate?: Date | null;
  deletedReason?: string | null;
  deletedPublic?: boolean | null;
  contents?: any;
  user__id?: string | null;
  user_displayName?: string | null;
  user_slug?: string | null;
  deletedByUser__id?: string | null;
  deletedByUser_displayName?: string | null;
  deletedByUser_slug?: string | null;
  post__id?: string | null;
  post_title?: string | null;
  post_slug?: string | null;
  title?: string | null;
  slug?: string | null;
  createdAt?: Date | null;
  bannedUserIds?: string[] | null;
  bannedUsers?: Array<{_id: string; displayName: string; slug: string}> | null;
  displayName?: string | null;
  bannedFrontpageUsers?: Array<{_id: string; displayName: string; slug: string}> | null;
  bannedPersonalUsers?: Array<{_id: string; displayName: string; slug: string}> | null;
  postedAt?: Date | null;
  reviewedByUser__id?: string | null;
  reviewedByUser_displayName?: string | null;
  reviewedByUser_slug?: string | null;
  rejectedReason?: string | null;
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const defaultLimit = 20;
  const params = await searchParams;

  // Separate pagination for each section
  const moderatorCommentsOffset = parseInt((params?.moderatorCommentsOffset as string) || '0', 10);
  const activeRateLimitsOffset = parseInt((params?.activeRateLimitsOffset as string) || '0', 10);
  const deletedCommentsOffset = parseInt((params?.deletedCommentsOffset as string) || '0', 10);
  const rejectedPostsOffset = parseInt((params?.rejectedPostsOffset as string) || '0', 10);
  const rejectedCommentsOffset = parseInt((params?.rejectedCommentsOffset as string) || '0', 10);
  const bannedFromPostsOffset = parseInt((params?.bannedFromPostsOffset as string) || '0', 10);
  const bannedFromUsersOffset = parseInt((params?.bannedFromUsersOffset as string) || '0', 10);
  const globallyBannedUsersOffset = parseInt((params?.globallyBannedUsersOffset as string) || '0', 10);

  // Toggle for showing expired vs active rate limits
  const showExpiredRateLimits = params?.showExpiredRateLimits === 'true';

  // Toggle for showing new user rate limits (users with < 5 posts + comments)
  const showNewUserRateLimits = params?.showNewUserRateLimits === 'true';

  // Toggle for showing expired bans (users with banned = null but who have ban history)
  const showExpiredBans = params?.showExpiredBans === 'true';

  const limit = defaultLimit;

  // Get SQL client for direct queries
  const db = getSqlClientOrThrow();

  // Fetch deleted comments with all related data in one query
  const [deletedCommentsData, deletedCommentsCountResult] = await Promise.all([
        db.manyOrNone<DbRow>(`
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
        `, [limit, deletedCommentsOffset]),
        db.one<{count: number}>(`
          SELECT COUNT(*) as count
          FROM "Comments"
          WHERE deleted = TRUE AND "deletedPublic" = TRUE
        `)
      ]);

  const deletedComments = deletedCommentsData.map(row => ({
    _id: row._id,
    userId: row.userId,
    postId: row.postId,
    deletedDate: row.deletedDate,
    deletedReason: row.deletedReason,
    deletedPublic: row.deletedPublic,
    contents: row.contents,
    user: row.user__id ? { _id: row.user__id, displayName: row.user_displayName, slug: row.user_slug } : null,
    deletedByUser: row.deletedByUser__id ? { _id: row.deletedByUser__id, displayName: row.deletedByUser_displayName, slug: row.deletedByUser_slug } : null,
    post: row.post__id ? { _id: row.post__id, title: row.post_title, slug: row.post_slug } : null,
  }));
  const deletedCommentsCount = deletedCommentsCountResult.count;

  // Fetch posts with banned users
  const [postsWithBannedUsersData, postsWithBannedUsersCountResult] = await Promise.all([
        db.manyOrNone<DbRow>(`
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
        `, [limit, bannedFromPostsOffset]),
        db.one<{count: number}>(`
          SELECT COUNT(*) as count
          FROM "Posts"
          WHERE "bannedUserIds" IS NOT NULL AND array_length("bannedUserIds", 1) > 0
        `)
      ]);

  const postsWithBannedUsers = postsWithBannedUsersData.map(row => ({
    _id: row._id,
    title: row.title,
    slug: row.slug,
    userId: row.userId,
    createdAt: row.createdAt,
    user: row.user__id ? { _id: row.user__id, displayName: row.user_displayName, slug: row.user_slug } : null,
    bannedUsers: row.bannedUsers || [],
  }));
  const postsWithBannedUsersCount = postsWithBannedUsersCountResult.count;

  // Fetch users with banned users
  const [usersWithBannedUsersData, usersWithBannedUsersCountResult] = await Promise.all([
        db.manyOrNone<DbRow>(`
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
        `, [limit, bannedFromUsersOffset]),
        db.one<{count: number}>(`
          SELECT COUNT(*) as count
          FROM "Users"
          WHERE ("bannedUserIds" IS NOT NULL AND array_length("bannedUserIds", 1) > 0)
             OR ("bannedPersonalUserIds" IS NOT NULL AND array_length("bannedPersonalUserIds", 1) > 0)
        `)
      ]);

  const usersWithBannedUsers = usersWithBannedUsersData.map(row => ({
    _id: row._id,
    displayName: row.displayName,
    slug: row.slug,
    bannedFrontpageUsers: row.bannedFrontpageUsers || [],
    bannedPersonalUsers: row.bannedPersonalUsers || [],
  }));
  const usersWithBannedUsersCount = usersWithBannedUsersCountResult.count;

  // Fetch moderator comment IDs only (client will fetch full data via GraphQL)
  const [moderatorCommentIdsData, moderatorCommentsCountResult] = await Promise.all([
        db.manyOrNone<{_id: string}>(`
          SELECT c._id
          FROM "Comments" c
          WHERE c."moderatorHat" = TRUE
          ORDER BY c."postedAt" DESC NULLS LAST
          LIMIT $1 OFFSET $2
        `, [limit, moderatorCommentsOffset]),
        db.one<{count: number}>(`
          SELECT COUNT(*) as count
          FROM "Comments"
          WHERE "moderatorHat" = TRUE
        `)
      ]);

  const moderatorCommentIds = moderatorCommentIdsData.map(row => row._id);
  const moderatorCommentsCount = moderatorCommentsCountResult.count;

  // Fetch moderator posts
  const moderatorPostsData = await db.manyOrNone<DbRow>(`
    SELECT
      p._id, p.title, p.slug, p."userId", p."postedAt",
      u._id as "user__id", u."displayName" as "user_displayName", u.slug as "user_slug"
    FROM "Posts" p
    LEFT JOIN "Users" u ON p."userId" = u._id
    WHERE p."moderatorPost" IS NOT NULL
    ORDER BY p."moderatorPost" ASC NULLS LAST
    LIMIT 10
  `);

  const moderatorPosts = moderatorPostsData.map(row => ({
    _id: row._id,
    title: row.title,
    slug: row.slug,
    userId: row.userId,
    postedAt: row.postedAt,
    user: row.user__id ? { _id: row.user__id, displayName: row.user_displayName, slug: row.user_slug } : null,
  }));

  // Fetch auto rate limits from events, grouped by user
  // Can show either active or expired rate limits based on toggle
  const [activeRateLimitsData, activeRateLimitsCountResult] = await Promise.all([
        db.manyOrNone<{
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
        }>(`
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
        `, [limit, activeRateLimitsOffset]),
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

  const activeRateLimits = activeRateLimitsData.map(row => ({
    userId: row.userId,
    rateLimits: JSON.parse(row.rateLimits),
    mostRecentActivation: row.mostRecentActivation,
    user: row.user__id ? {
      _id: row.user__id,
      displayName: row.user_displayName,
      slug: row.user_slug,
      createdAt: row.user_createdAt,
      karma: row.user_karma,
      postCount: row.user_postCount,
      commentCount: row.user_commentCount,
    } : null,
  }));
  const activeRateLimitsCount = activeRateLimitsCountResult.count;

  // Fetch rejected posts
  const [rejectedPostsData, rejectedPostsCountResult] = await Promise.all([
        db.manyOrNone<DbRow>(`
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
        `, [limit, rejectedPostsOffset]),
        db.one<{count: number}>(`
          SELECT COUNT(*) as count
          FROM "Posts"
          WHERE rejected = TRUE
        `)
      ]);

  const rejectedPosts = rejectedPostsData.map(row => ({
    _id: row._id,
    title: row.title,
    slug: row.slug,
    userId: row.userId,
    postedAt: row.postedAt,
    rejectedReason: row.rejectedReason,
    user: row.user__id ? { _id: row.user__id, displayName: row.user_displayName, slug: row.user_slug } : null,
    reviewedByUser: row.reviewedByUser__id ? { _id: row.reviewedByUser__id, displayName: row.reviewedByUser_displayName, slug: row.reviewedByUser_slug } : null,
  }));
  const rejectedPostsCount = rejectedPostsCountResult.count;

  // Fetch rejected comments
  const [rejectedCommentsData, rejectedCommentsCountResult] = await Promise.all([
        db.manyOrNone<DbRow>(`
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
        `, [limit, rejectedCommentsOffset]),
        db.one<{count: number}>(`
          SELECT COUNT(*) as count
          FROM "Comments"
          WHERE rejected = TRUE
        `)
      ]);

  const rejectedComments = rejectedCommentsData.map(row => ({
    _id: row._id,
    userId: row.userId,
    postId: row.postId,
    postedAt: row.postedAt,
    rejectedReason: row.rejectedReason,
    contents: row.contents,
    user: row.user__id ? { _id: row.user__id, displayName: row.user_displayName, slug: row.user_slug } : null,
    reviewedByUser: row.reviewedByUser__id ? { _id: row.reviewedByUser__id, displayName: row.reviewedByUser_displayName, slug: row.reviewedByUser_slug } : null,
    post: row.post__id ? { _id: row.post__id, title: row.post_title, slug: row.post_slug } : null,
  }));
  const rejectedCommentsCount = rejectedCommentsCountResult.count;

  // Fetch globally banned users
  // Active bans: banned > NOW()
  // Expired bans: banned <= NOW()
  const [globallyBannedUsersData, globallyBannedUsersCountResult] = await Promise.all([
        db.manyOrNone<{
          _id: string;
          displayName: string | null;
          slug: string;
          karma: number | null;
          createdAt: Date | null;
          postCount: number | null;
          commentCount: number | null;
          banned: Date | null;
        }>(`
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
            AND ${showExpiredBans ? `u.banned <= NOW()` : `u.banned > NOW()`}
          ORDER BY u.karma DESC NULLS LAST
          LIMIT $1 OFFSET $2
        `, [limit, globallyBannedUsersOffset]),
        db.one<{count: number}>(`
          SELECT COUNT(*) as count
          FROM "Users"
          WHERE banned IS NOT NULL
            AND ${showExpiredBans ? `banned <= NOW()` : `banned > NOW()`}
        `)
      ]);

  const globallyBannedUsers = globallyBannedUsersData;
  const globallyBannedUsersCount = globallyBannedUsersCountResult.count;

  return (
    <RouteRoot>
      <ModerationPageContent
        moderatorCommentIds={moderatorCommentIds}
        moderatorCommentsCount={moderatorCommentsCount}
        moderatorCommentsOffset={moderatorCommentsOffset}
        moderatorPosts={moderatorPosts as ModerationPost[]}
        activeRateLimits={activeRateLimits as ActiveRateLimit[]}
        activeRateLimitsCount={activeRateLimitsCount}
        activeRateLimitsOffset={activeRateLimitsOffset}
        showExpiredRateLimits={showExpiredRateLimits}
        showNewUserRateLimits={showNewUserRateLimits}
        deletedComments={deletedComments as ModerationComment[]}
        deletedCommentsCount={deletedCommentsCount}
        deletedCommentsOffset={deletedCommentsOffset}
        rejectedPosts={rejectedPosts as ModerationPost[]}
        rejectedPostsCount={rejectedPostsCount}
        rejectedPostsOffset={rejectedPostsOffset}
        rejectedComments={rejectedComments as ModerationComment[]}
        rejectedCommentsCount={rejectedCommentsCount}
        rejectedCommentsOffset={rejectedCommentsOffset}
        postsWithBannedUsers={postsWithBannedUsers as ModerationPost[]}
        postsWithBannedUsersCount={postsWithBannedUsersCount}
        postsWithBannedUsersOffset={bannedFromPostsOffset}
        usersWithBannedUsers={usersWithBannedUsers as ModerationUser[]}
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
