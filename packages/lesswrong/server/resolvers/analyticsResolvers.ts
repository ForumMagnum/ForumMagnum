import { PostAnalyticsResult } from "../../components/hooks/usePostAnalytics";
import { forumTypeSetting } from "../../lib/instanceSettings";
import { getAnalyticsConnection, getAnalyticsConnectionOrThrow } from "../analytics/postgresConnection";
import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../vulcan-lib";
import  camelCase  from "lodash/camelCase";
import { canUserEditPostMetadata } from "../../lib/collections/posts/helpers";
import { AnalyticsSeriesValue, MultiPostAnalyticsResult, PostAnalytics2Result } from "../../components/hooks/useAnalytics";
import Posts from "../../lib/collections/posts/collection";
import { getHybridView } from "../analytics/hybridViews";
import { userIsAdminOrMod } from "../../lib/vulcan-users";
import { POST_VIEWS_IDENTIFIER } from "../analytics/postViewsHybridView";
import { POST_VIEW_TIMES_IDENTIFIER } from "../analytics/postViewTimesHybridView";
import moment from "moment";
import groupBy from "lodash/groupBy";
import { executeChunkedQueue } from "../../lib/utils/asyncUtils";
import { generateDateSeries } from "../../lib/helpers";
import { DatabasePublicSetting } from "../../lib/publicSettings";

// Queries are executed in batches of post ids. This is mainly to coerce postgres into using
// the index on post_id (via get_post_id_from_path(event ->> 'path'::text)). If you give it too
// many ids at once it will try to filter by timestamp first and then sequentially scan to filter
// by post_id, which is much (much!) slower.
const MAX_CONCURRENT_QUERIES = 8;
// Note: there is currently a bug/behaviour where, just after the materialized view is refreshed, postgres
// is even more averse to using the index on post_id. This is because the amount of live data to check is smaller
// so it thinks it's faster to just use the filter on timestamp and then scan through to filter by post_id, this is
// in fact much slower. I'm trying ways to get around this, but for now I've just set the batch size to 1, which does
// cause it to spam a lot of queries, but even so it's much faster than the alternative.
const liveBatchSizeSetting = new DatabasePublicSetting<number>("analytics.liveBatchSize", 1);
const materializedBatchSizeSetting = new DatabasePublicSetting<number>("analytics.materializedBatchSize", 1);

/**
 * Based on an analytics query, returns a function that runs that query
 */
function makePgAnalyticsQueryScalar({query, resultColumns}: {query: string, resultColumns: string[]}) {
  return async (post: DbPost) => {
    const postgres = getAnalyticsConnection();
    if (!postgres) throw new Error("Unable to connect to analytics database - no database configured");

    const queryVars = [post._id];

    const pgResult = await postgres.query(query, queryVars);

    if (!pgResult.length) {
      throw new Error(`No data found for post ${post.title}`);
    }
    if (pgResult.length > 1) {
      throw new Error(`Multiple rows found for post ${post.title}`);
    }

    const result = Object.fromEntries(resultColumns.map(resultColumn => [camelCase(resultColumn), pgResult[0][resultColumn]]))
    return result
  };
}

function makePgAnalyticsQuerySeries({query, resultColumnRenaming, resultKey}: {query: string, resultColumnRenaming: {[column: string]: string}, resultKey: keyof PostAnalyticsResult}) {
  return async (post: DbPost) => {
    const postgres = getAnalyticsConnection();
    if (!postgres) throw new Error("Unable to connect to analytics database - no database configured");

    const queryVars = [post._id];

    const pgResult = await postgres.query(query, queryVars);
    if (!pgResult.length) {
      // eslint-disable-next-line no-console
      console.warn(`No data found for post ${post.title}`);
      // Should be prepared to return an empty array here
    }

    const result = {[resultKey]: pgResult.map((row: any) => Object.fromEntries(
      Object.entries(row).map(
        ([column, values]) => [resultColumnRenaming[column], values]
      )
    ))}
    return result
  }
}

/**
 * Generates an OR condition that is essentially equivalent to `columnName IN (ids)`.
 * This encourages postgres to use the index on `columnName` if one exists.
 */
function generateOrConditionQuery(columnName: string, ids: string[]): string {
  // 8 appears to be about the cutoff where IN is faster than OR
  if (ids.length < 8) {
    return ids.map((id, index) => `${columnName} = $${index + 1}`).join(' OR ');
  } else {
    // IN
    return `${columnName} IN (${ids.map((id, index) => `$${index + 1}`).join(', ')})`;
  }
  
}

type QueryFunc = (post: DbPost) => Promise<Partial<PostAnalyticsResult>>;

const queries: QueryFunc[] = [
  makePgAnalyticsQueryScalar({
    query: `
      SELECT COUNT(*) AS all_views
      FROM page_view
      WHERE post_id = $1
    `,
    resultColumns: ["all_views"]
  }),
  makePgAnalyticsQueryScalar({
    query: `
      SELECT COUNT(DISTINCT client_id) AS unique_client_views
      FROM page_view
      WHERE post_id = $1
        AND client_id IS NOT NULL
    `,
    resultColumns: ["unique_client_views"]
  }),
  // TODO: implement median function and change avg call to use it
  makePgAnalyticsQueryScalar({
    query: `
      SELECT
        COUNT(*) AS unique_client_views_10_sec,
        PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY total_reading_time) AS median_reading_time,
        COUNT(*) FILTER (WHERE total_reading_time > 5*60) AS unique_client_views_5_min
      FROM (
        SELECT
          client_id,
          sum(increment) AS total_reading_time
        FROM event_timer_event
        WHERE post_id = $1
          AND client_id IS NOT NULL
        GROUP BY client_id
      ) a
    `,
    resultColumns: [
      "unique_client_views_10_sec",
      "median_reading_time",
      "unique_client_views_5_min"
    ]
  }),
  makePgAnalyticsQuerySeries({
    // a masterpiece
    query: `
      WITH unique_client_views AS (
        SELECT
          COUNT(DISTINCT client_id) AS unique_client_views,
          timestamp::DATE AS date
        FROM page_view
        WHERE post_id = $1
        GROUP BY timestamp::DATE
      ),
      min_date AS (
        SELECT MIN(date) AS min_date
        FROM unique_client_views
        WHERE unique_client_views.unique_client_views > 0
      ),
      eligible_dates AS (
        SELECT (generate_series(min_date, NOW()::DATE, '1 day'::INTERVAL))::DATE AS date FROM min_date
      )
      SELECT
        coalesce(unique_client_views.unique_client_views, 0) AS unique_client_views,
        eligible_dates.date
      FROM unique_client_views
      RIGHT JOIN eligible_dates ON eligible_dates.date = unique_client_views.date
      ORDER BY date;
    `,
     resultColumnRenaming: {date: 'date', unique_client_views: 'uniqueClientViews'},
     resultKey: 'uniqueClientViewsSeries'
  })
];

addGraphQLResolvers({
  Query: {
    async PostAnalytics(
      root: void,
      { postId }: { postId: string },
      context: ResolverContext
    ): Promise<PostAnalyticsResult> {
      const { currentUser } = context;
      if (!currentUser) throw new Error(`No user`);
      const post = await context.loaders.Posts.load(postId);
      // check that the current user has permission to view post metrics
      // LW doesn't want to show this to authors, but we'll let admins see it
      if (forumTypeSetting.get() !== "EAForum" && !currentUser.isAdmin) {
        throw new Error("Permission denied");
      }
      // Maybe check for karma level here?
      if (
        !canUserEditPostMetadata(currentUser, post) &&
        !currentUser.groups.includes("sunshineRegiment")
      ) {
        throw new Error("Permission denied");
      }

      // I really wanted to do this as a map, but I want to do this in serial,
      // and couldn't get it to work the way I wanted
      let postAnalytics: Partial<PostAnalyticsResult> = {};
      for (const queryFunc of queries) {
        const queryResult = await queryFunc(post);
        postAnalytics = {...postAnalytics, ...queryResult}
      }
      
      // There's no good way to tell TS that because we've iterated over all the
      // keys, the partial is no longer partial
      return postAnalytics as PostAnalyticsResult;
    },
    async MultiPostAnalytics(
      root: void,
      {
        userId,
        postIds: postIdsInput,
        sortBy,
        desc,
        limit,
        cachedOnly,
      }: { userId: string; postIds: string[] | null; sortBy: string | null; desc: boolean | null; limit: number | null, cachedOnly: boolean | null },
      context: ResolverContext
    ): Promise<MultiPostAnalyticsResult> {
      // These are null (not undefined) if not provided, so we have to explicitly set them to the default
      sortBy = sortBy ?? "postedAt";
      desc = desc ?? true;
      limit = limit ?? 10;
      const batchSize = cachedOnly ? materializedBatchSizeSetting.get() : liveBatchSizeSetting.get();
      
      // Directly sortable fields can be sorted and filtered on before querying the analytics database,
      // so we can avoid querying for most of the post ids. Indirectly sortable fields are calculated
      // rely on the results from the analytics database, so we have to query for all the post ids and then
      // sort and filter afterwards.
      const DIRECTLY_SORTABLE_FIELDS = ["postedAt", "baseScore", "commentCount"];
      const INDIRECTLY_SORTABLE_FIELDS = ["views", "reads"];

      const { currentUser } = context;
      const analyticsDb = getAnalyticsConnectionOrThrow();

      if (currentUser?._id !== userId && !userIsAdminOrMod(currentUser)) {
        throw new Error("Permission denied");
      }

      const directlySortable = DIRECTLY_SORTABLE_FIELDS.includes(sortBy);

      const postSelector = {
        ...(userId && {$or: [{ userId: userId }, { "coauthorStatuses.userId": userId }]}),
        ...(postIdsInput && { _id: { $in: postIdsInput } }),
        rejected: { $ne: true },
        draft: false,
        isEvent: false,
      };
      const postCountPromise = Posts.find(postSelector).count();
      const userPosts = await Posts.find(postSelector, {
        ...(directlySortable && { sort: { [sortBy]: desc ? -1 : 1 } }),
        ...(directlySortable && { limit }),
        projection: {
          _id: 1,
          title: 1,
          slug: 1,
          postedAt: 1,
          baseScore: 1,
          commentCount: 1,
        },
      }).fetch();

      const postsById = Object.fromEntries(userPosts.map((post) => [post._id, post]));
      const postIds = userPosts.map((post) => post._id);

      if (!postIds.length) {
        return {
          posts: [],
          totalCount: 0,
        };
      }

      const postViewsView = getHybridView(POST_VIEWS_IDENTIFIER);
      const postViewTimesView = getHybridView(POST_VIEW_TIMES_IDENTIFIER);

      if (!postViewsView || !postViewTimesView) throw new Error("Hybrid views not configured");

      const [viewsTable, postViewTimesTable] = await Promise.all([
        postViewsView.virtualTable(),
        postViewTimesView.virtualTable(),
      ]);

      const cachedOnlyQuery = cachedOnly ? "AND source <> 'live'" : "";

      const [viewsResults, readsResults] = await Promise.all([
        executeChunkedQueue(async (batch: string[]) => {
          return analyticsDb.any<{ _id: string; total_view_count: number, total_unique_view_count: number }>(
          `
          SELECT
            post_id AS _id,
            sum(view_count) AS total_view_count,
            sum(unique_view_count) AS total_unique_view_count
          FROM
            (${viewsTable}) q
          WHERE
            (${generateOrConditionQuery("post_id", batch)})
            ${cachedOnlyQuery}
          GROUP BY
            post_id;
          `,
            batch
          );
        }, postIds, batchSize, MAX_CONCURRENT_QUERIES),
        executeChunkedQueue(async (batch: string[]) => {
          return analyticsDb.any<{ _id: string; total_read_count: number, mean_reading_time: number }>(
          `
          SELECT
            post_id AS _id,
            -- A "read" is anything with a reading_time over 30 seconds
            sum(CASE WHEN reading_time >= 30 THEN 1 ELSE 0 END) AS total_read_count,
            avg(reading_time) AS mean_reading_time
          FROM
            (${postViewTimesTable}) q
          WHERE
            (${generateOrConditionQuery("post_id", batch)})
            ${cachedOnlyQuery}
          GROUP BY
            post_id;
          `,
            batch
          );
        }, postIds, batchSize, MAX_CONCURRENT_QUERIES)
      ]);

      // Flatten the results
      const viewsById = Object.fromEntries(viewsResults.map((row) => [row._id, row.total_view_count]));
      const uniqueViewsById = Object.fromEntries(viewsResults.map((row) => [row._id, row.total_unique_view_count]));
      const readsById = Object.fromEntries(readsResults.map((row) => [row._id, row.total_read_count]));
      const meanReadingTimeById = Object.fromEntries(readsResults.map((row) => [row._id, row.mean_reading_time]));

      let sortedAndLimitedPostIds: string[] = postIds;
      if (INDIRECTLY_SORTABLE_FIELDS.includes(sortBy)) {
        const sortMap = sortBy === "views" ? viewsById : readsById;
        sortedAndLimitedPostIds = postIds.sort((a, b) => {
          const aVal = sortMap[a] ?? 0;
          const bVal = sortMap[b] ?? 0;
          return desc ? bVal - aVal : aVal - bVal;
        });
      }
      sortedAndLimitedPostIds = sortedAndLimitedPostIds.slice(0, limit);

      const posts: PostAnalytics2Result[] = sortedAndLimitedPostIds.map((_id, idx) => {
        return {
          _id,
          title: postsById[_id].title,
          slug: postsById[_id].slug,
          postedAt: postsById[_id].postedAt,
          views: viewsById[_id] ?? 0,
          uniqueViews: uniqueViewsById[_id] ?? 0,
          reads: readsById[_id] ?? 0,
          meanReadingTime: meanReadingTimeById[_id] ?? 0,
          karma: postsById[_id].baseScore,
          comments: postsById[_id].commentCount ?? 0,
        };
      });

      return {
        posts: posts,
        totalCount: await postCountPromise,
      };
    },
    async AnalyticsSeries(
      root: void,
      {
        userId,
        postIds,
        startDate,
        endDate,
        cachedOnly,
      }: {
        userId: string | null;
        postIds: string[] | null;
        startDate: Date | null;
        endDate: Date | null;
        cachedOnly: boolean | null;
      },
      context: ResolverContext
    ): Promise<AnalyticsSeriesValue[]> {
      const batchSize = cachedOnly ? materializedBatchSizeSetting.get() : liveBatchSizeSetting.get();

      const { currentUser } = context;
      const analyticsDb = getAnalyticsConnectionOrThrow();
    
      if (currentUser?._id !== userId && !userIsAdminOrMod(currentUser)) {
        throw new Error("Permission denied");
      }
      if (!userId && (!postIds || !postIds.length)) {
        throw new Error("Must provide either userId or postIds");
      }
      if (!endDate) {
        throw new Error("Must provide endDate");
      }
    
      // Round start date down to nearest day in UTC
      const adjustedStartDate = startDate ? moment(new Date(startDate)).utc().startOf("day") : undefined;
      const adjustedEndDate = moment(new Date(endDate)).utc().add(1, "days").startOf("day");

      let queryPostIds: string[] = postIds || [];
      if (userId) {
        const postSelector = {
          $or: [{ userId: userId }, { "coauthorStatuses.userId": userId }],
          rejected: { $ne: true },
          draft: false,
          isEvent: false
        }
        const userPosts = await Posts.find(postSelector, {
          projection: {
            _id: 1,
          },
        }).fetch();
        queryPostIds = userPosts.map((post) => post._id);
      }

      const postViewsView = getHybridView(POST_VIEWS_IDENTIFIER);
      const postViewTimesView = getHybridView(POST_VIEW_TIMES_IDENTIFIER);

      if (!postViewsView || !postViewTimesView) throw new Error("Hybrid views not configured");

      const [viewsTable, postViewTimesTable] = await Promise.all([
        postViewsView.virtualTable(),
        postViewTimesView.virtualTable(),
      ]);

      const cachedOnlyQuery = cachedOnly ? "AND source <> 'live'" : "";
      const [viewRes, readRes, karmaRes, commentRes] = await Promise.all([
        executeChunkedQueue(async (batch: string[]) => {
          return analyticsDb.any<{ window_start_key: string; view_count: string }>(
            `
              SELECT
                -- Format as YYYY-MM-DD to make grouping easier
                to_char(window_start, 'YYYY-MM-DD') AS window_start_key,
                sum(view_count) AS view_count
              FROM
                (${viewsTable}) q
              WHERE
                (${generateOrConditionQuery("post_id", batch)})
                ${adjustedStartDate ? `AND window_start >= '${adjustedStartDate.toISOString()}'::timestamp` : ""}
                AND window_end <= '${adjustedEndDate.toISOString()}'::timestamp
                ${cachedOnlyQuery}
              GROUP BY
                window_start_key;
          `, batch)
        }, queryPostIds, batchSize, MAX_CONCURRENT_QUERIES),
        executeChunkedQueue(async (batch: string[]) => {
          return analyticsDb.any<{ window_start_key: string; read_count: string }>(
            `
              SELECT
                -- Format as YYYY-MM-DD to make grouping easier
                to_char(window_start, 'YYYY-MM-DD') AS window_start_key,
                sum(CASE WHEN reading_time >= 30 THEN 1 ELSE 0 END) AS read_count
              FROM
                (${postViewTimesTable}) q
              WHERE
                (${generateOrConditionQuery("post_id", batch)})
                ${adjustedStartDate ? `AND window_start >= '${adjustedStartDate.toISOString()}'::timestamp` : ""}
                AND window_end <= '${adjustedEndDate.toISOString()}'::timestamp
                ${cachedOnlyQuery}
              GROUP BY
                window_start_key;
            `, batch)
        }, queryPostIds, batchSize, MAX_CONCURRENT_QUERIES),
        context.repos.votes.getPostKarmaChangePerDay({
          postIds: queryPostIds,
          startDate: adjustedStartDate?.toDate(),
          endDate: adjustedEndDate.toDate(),
        }),
        context.repos.comments.getCommentsPerDay({
          postIds: queryPostIds,
          startDate: adjustedStartDate?.toDate(),
          endDate: adjustedEndDate.toDate(),
        }),
      ])

      const viewsByDate = groupBy(viewRes, "window_start_key");
      const readsByDate = groupBy(readRes, "window_start_key");
      const commentsByDate = groupBy(commentRes, "window_start_key");
      const karmaByDate = groupBy(karmaRes, "window_start_key");

      const lowestStartDate =
        adjustedStartDate ??
        moment.min(
          moment.min(Object.keys(viewsByDate).map((date) => moment(date))),
          moment.min(Object.keys(readsByDate).map((date) => moment(date))),
          moment.min(Object.keys(commentsByDate).map((date) => moment(date))),
          moment.min(Object.keys(karmaByDate).map((date) => moment(date)))
        );
      
      const result = generateDateSeries(lowestStartDate, adjustedEndDate).map((date) => ({
        date: new Date(date),
        views: viewsByDate[date]?.reduce((acc, curr) => acc + parseInt(curr.view_count ?? 0), 0) ?? 0,
        reads: readsByDate[date]?.reduce((acc, curr) => acc + parseInt(curr.read_count ?? 0), 0) ?? 0,
        karma: karmaByDate[date]?.reduce((acc, curr) => acc + parseInt(curr.karma_change ?? 0), 0) ?? 0,
        comments: commentsByDate[date]?.reduce((acc, curr) => acc + parseInt(curr.comment_count ?? 0), 0) ?? 0
      }));
      // Remove leading values where all fields are 0
      const truncatedResult = result.slice(result.findIndex((value) => (
        value.views !== 0 || value.reads !== 0 || value.karma !== 0 || value.comments !== 0
      )));
      return truncatedResult;
    },
    
  },
});

addGraphQLSchema(`
  type UniqueClientViewsSeries {
    uniqueClientViews: Int
    date: Date
  }

  type PostAnalyticsResult {
    allViews: Int
    uniqueClientViews: Int
    uniqueClientViews10Sec: Int
    medianReadingTime: Int
    uniqueClientViews5Min: Int
    uniqueClientViewsSeries: [UniqueClientViewsSeries]
  }
`);

addGraphQLSchema(`
  type PostAnalytics2Result {
    _id: String
    title: String
    slug: String
    postedAt: Date
    views: Int
    uniqueViews: Int
    reads: Int
    meanReadingTime: Float
    karma: Int
    comments: Int
  }

  type MultiPostAnalyticsResult {
    posts: [PostAnalytics2Result]
    totalCount: Int!
  }
`);

addGraphQLSchema(`
  type AnalyticsSeriesValue {
    date: Date
    views: Int
    reads: Int
    karma: Int
    comments: Int
  }
`);

addGraphQLQuery("PostAnalytics(postId: String!): PostAnalyticsResult!");
addGraphQLQuery("MultiPostAnalytics(userId: String, postIds: [String], sortBy: String, desc: Boolean, limit: Int, cachedOnly: Boolean): MultiPostAnalyticsResult!");
addGraphQLQuery("AnalyticsSeries(userId: String, postIds: [String], startDate: Date, endDate: Date, cachedOnly: Boolean): [AnalyticsSeriesValue]");
