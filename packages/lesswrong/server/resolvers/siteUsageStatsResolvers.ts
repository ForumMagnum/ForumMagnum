import gql from "graphql-tag";
import moment from "moment";
import { getAnalyticsConnection } from "../analytics/postgresConnection";
import { userIsAdmin } from "../../lib/vulcan-users/permissions";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import { generateDateSeries } from "../../lib/helpers";

/**
 * Hard cap on the size of any single date range accepted by these queries, so
 * a single request can never trigger an unbounded scan of the analytics
 * page_view table. The client requests longer spans (e.g. the timeline
 * scrubber's history sweep) as a sequence of windows at most this wide.
 */
export const MAX_SITE_USAGE_RANGE_DAYS = 190;

const TOP_POSTS_LIMIT = 20;

interface SiteUsageDateRange {
  /** Inclusive, midnight UTC */
  windowStart: Date;
  /** Exclusive, midnight UTC */
  windowEnd: Date;
}

function resolveDateRange(startDate: Date, endDate: Date): SiteUsageDateRange {
  const windowStart = moment.utc(startDate).startOf("day");
  const windowEnd = moment.utc(endDate).add(1, "day").startOf("day");
  const rangeDays = windowEnd.diff(windowStart, "days");
  if (rangeDays < 1) {
    throw new Error("endDate must not be before startDate");
  }
  if (rangeDays > MAX_SITE_USAGE_RANGE_DAYS) {
    throw new Error(`Date range too large: request at most ${MAX_SITE_USAGE_RANGE_DAYS} days at a time`);
  }
  return { windowStart: windowStart.toDate(), windowEnd: windowEnd.toDate() };
}

function assertUserIsAdmin(context: ResolverContext) {
  if (!userIsAdmin(context.currentUser)) {
    throw new Error("Permission denied");
  }
}

function getAnalyticsDbOrThrow() {
  const db = getAnalyticsConnection();
  if (!db) {
    throw new Error("Unable to connect to analytics database - no database configured");
  }
  return db;
}

interface DailyViewsRow {
  date: string;
  views: string;
  unique_views: string;
}

async function queryDailyViews({ windowStart, windowEnd }: SiteUsageDateRange): Promise<{ date: string; views: number; uniqueViews: number }[]> {
  const db = getAnalyticsDbOrThrow();
  const rows: DailyViewsRow[] = await db.query(`
    -- siteUsageStatsResolvers.queryDailyViews
    SELECT
      to_char(timestamp, 'YYYY-MM-DD') AS date,
      COUNT(*) AS views,
      COUNT(DISTINCT client_id) AS unique_views
    FROM page_view
    WHERE timestamp >= $1 AND timestamp < $2
    GROUP BY 1
    ORDER BY 1
  `, [windowStart, windowEnd]);
  return rows.map((row) => ({
    date: row.date,
    views: parseInt(row.views),
    uniqueViews: parseInt(row.unique_views),
  }));
}

/**
 * Like queryDailyViews but without the DISTINCT client_id count, which is the
 * expensive part. Used for the timeline scrubber's background traffic graph,
 * where only the overall shape matters.
 */
async function queryDailyViewsLight({ windowStart, windowEnd }: SiteUsageDateRange): Promise<{ date: string; views: number }[]> {
  const db = getAnalyticsDbOrThrow();
  const rows: { date: string; views: string }[] = await db.query(`
    -- siteUsageStatsResolvers.queryDailyViewsLight
    SELECT
      to_char(timestamp, 'YYYY-MM-DD') AS date,
      COUNT(*) AS views
    FROM page_view
    WHERE timestamp >= $1 AND timestamp < $2
    GROUP BY 1
    ORDER BY 1
  `, [windowStart, windowEnd]);
  return rows.map((row) => ({
    date: row.date,
    views: parseInt(row.views),
  }));
}

async function queryRangeTotals({ windowStart, windowEnd }: SiteUsageDateRange): Promise<{ totalViews: number; totalUniqueViews: number }> {
  const db = getAnalyticsDbOrThrow();
  const rows: { views: string; unique_views: string }[] = await db.query(`
    -- siteUsageStatsResolvers.queryRangeTotals
    SELECT
      COUNT(*) AS views,
      COUNT(DISTINCT client_id) AS unique_views
    FROM page_view
    WHERE timestamp >= $1 AND timestamp < $2
  `, [windowStart, windowEnd]);
  return {
    totalViews: parseInt(rows[0].views),
    totalUniqueViews: parseInt(rows[0].unique_views),
  };
}

async function queryTopPostViews({ windowStart, windowEnd }: SiteUsageDateRange): Promise<{ postId: string; views: number; uniqueViews: number }[]> {
  const db = getAnalyticsDbOrThrow();
  const rows: { post_id: string; views: string; unique_views: string }[] = await db.query(`
    -- siteUsageStatsResolvers.queryTopPostViews
    SELECT
      post_id,
      COUNT(*) AS views,
      COUNT(DISTINCT client_id) AS unique_views
    FROM page_view
    WHERE timestamp >= $1 AND timestamp < $2
      AND post_id IS NOT NULL
    GROUP BY post_id
    ORDER BY views DESC
    LIMIT $3
  `, [windowStart, windowEnd, TOP_POSTS_LIMIT]);
  return rows.map((row) => ({
    postId: row.post_id,
    views: parseInt(row.views),
    uniqueViews: parseInt(row.unique_views),
  }));
}

interface SiteUsageTopPost {
  postId: string;
  title: string | null;
  slug: string | null;
  views: number;
  uniqueViews: number;
}

async function loadTopPosts(
  topPostViews: { postId: string; views: number; uniqueViews: number }[],
  context: ResolverContext,
): Promise<SiteUsageTopPost[]> {
  if (!topPostViews.length) return [];
  const rawPosts = await context.loaders.Posts.loadMany(topPostViews.map(({ postId }) => postId));
  const loadedPosts = rawPosts.filter((post): post is DbPost => !!post && !(post instanceof Error));
  const visiblePosts = await accessFilterMultiple(context.currentUser, "Posts", loadedPosts, context);
  const postsById = new Map(visiblePosts.map((post) => [post._id, post]));
  return topPostViews.map(({ postId, views, uniqueViews }) => {
    const post = postsById.get(postId);
    return {
      postId,
      title: post?.title ?? null,
      slug: post?.slug ?? null,
      views,
      uniqueViews,
    };
  });
}

const countByDate = (rows: { date: string; count: number }[]): Record<string, number> =>
  Object.fromEntries(rows.map(({ date, count }) => [date, count]));

export const siteUsageStatsGraphQLTypeDefs = gql`
  type SiteUsageStatsDay {
    date: String!
    views: Int!
    uniqueViews: Int!
    postsPublished: Int!
    commentsPosted: Int!
    votesCast: Int!
    newUsers: Int!
  }
  type SiteUsageTopPost {
    postId: String!
    title: String
    slug: String
    views: Int!
    uniqueViews: Int!
  }
  type SiteUsageStatsResult {
    days: [SiteUsageStatsDay!]!
    totalViews: Int!
    totalUniqueViews: Int!
    topPosts: [SiteUsageTopPost!]!
  }
  type SiteUsageHistoryDay {
    date: String!
    views: Int!
  }
  extend type Query {
    SiteUsageStats(startDate: Date!, endDate: Date!): SiteUsageStatsResult!
    SiteUsageHistory(startDate: Date!, endDate: Date!): [SiteUsageHistoryDay!]!
  }
`;

export const siteUsageStatsGraphQLQueries = {
  async SiteUsageStats(
    root: void,
    { startDate, endDate }: { startDate: Date; endDate: Date },
    context: ResolverContext,
  ) {
    assertUserIsAdmin(context);
    const range = resolveDateRange(startDate, endDate);

    const [dailyViews, totals, topPostViews, postsRows, commentsRows, votesRows, newUsersRows] = await Promise.all([
      queryDailyViews(range),
      queryRangeTotals(range),
      queryTopPostViews(range),
      context.repos.posts.getPostsPublishedPerDay(range),
      context.repos.comments.getCommentsPostedPerDay(range),
      context.repos.votes.getVotesCastPerDay(range),
      context.repos.users.getNewUsersPerDay(range),
    ]);

    const viewsByDate = Object.fromEntries(dailyViews.map((row) => [row.date, row]));
    const postsByDate = countByDate(postsRows);
    const commentsByDate = countByDate(commentsRows);
    const votesByDate = countByDate(votesRows);
    const newUsersByDate = countByDate(newUsersRows);

    const days = generateDateSeries(range.windowStart, range.windowEnd).map((date) => ({
      date,
      views: viewsByDate[date]?.views ?? 0,
      uniqueViews: viewsByDate[date]?.uniqueViews ?? 0,
      postsPublished: postsByDate[date] ?? 0,
      commentsPosted: commentsByDate[date] ?? 0,
      votesCast: votesByDate[date] ?? 0,
      newUsers: newUsersByDate[date] ?? 0,
    }));

    return {
      days,
      totalViews: totals.totalViews,
      totalUniqueViews: totals.totalUniqueViews,
      topPosts: await loadTopPosts(topPostViews, context),
    };
  },

  async SiteUsageHistory(
    root: void,
    { startDate, endDate }: { startDate: Date; endDate: Date },
    context: ResolverContext,
  ) {
    assertUserIsAdmin(context);
    const range = resolveDateRange(startDate, endDate);
    return await queryDailyViewsLight(range);
  },
};
