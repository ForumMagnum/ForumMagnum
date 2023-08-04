import { PostAnalyticsResult } from "../../components/posts/usePostAnalytics";
import { forumTypeSetting } from "../../lib/instanceSettings";
import { getAnalyticsConnection, getAnalyticsConnectionOrThrow } from "../analytics/postgresConnection";
import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema, viewFieldAllowAny } from "../vulcan-lib";
import  camelCase  from "lodash/camelCase";
import { canUserEditPostMetadata } from "../../lib/collections/posts/helpers";
import { AuthorAnalyticsResult, PostAnalytics2Result } from "../../components/users/useAuthorAnalytics";
import Posts from "../../lib/collections/posts/collection";
import { getHybridView } from "../analytics/hybridViews";
import { userIsAdminOrMod } from "../../lib/vulcan-users";
import { post } from "request";
import chunk from "lodash/chunk";
import { inspect } from "util";

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
 * This forces postgres to use the index on `columnName` if one exists.
 */
function generateOrConditionQuery(columnName: string, ids: string[]): string {
  return ids.map((id, index) => `${columnName} = $${index + 1}`).join(' OR ');
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
    async AuthorAnalytics(
      root: void,
      {
        userId,
        sortBy,
        desc,
        limit,
      }: { userId: string; sortBy: string | null; desc: boolean | null; limit: number | null },
      context: ResolverContext
    ): Promise<AuthorAnalyticsResult> {
      // These are null (not undefined) if not provided, so we have to explicitly set them to the default
      sortBy = sortBy ?? "postedAt";
      desc = desc ?? true;
      limit = limit ?? 10;

      // Queries are executed in batches of post ids. This is mainly to coerce postgres into using
      // the index on post_id (via get_post_id_from_path(event ->> 'path'::text)). If you give it too
      // many ids at once it will try to filter by timestamp first and then sequentially scan to filter
      // by post_id, which is much (much!) slower.
      const MAX_CONCURRENT_QUERIES = 8;
      const BATCH_SIZE = 5;
      
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
        $or: [{ userId: userId }, { "coauthorStatuses.userId": userId }],
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

      const postViewsView = getHybridView("post_views");
      const postViewTimesView = getHybridView("post_view_times");

      if (!postViewsView || !postViewTimesView) throw new Error("Hybrid views not configured");

      const [viewsTable, postViewTimesTable] = await Promise.all([
        postViewsView.virtualTable(),
        postViewTimesView.virtualTable(),
      ]);

      const postIdsBatches = chunk(postIds, BATCH_SIZE);

      let viewsResults: { _id: string; total_view_count: number }[] = [];
      let readsResults: { _id: string; total_read_count: number }[] = [];

      async function runViewsQuery(batch: string[]) {
        const viewsResult = await analyticsDb.any<{ _id: string; total_view_count: number }>(
          `
          SELECT
            post_id AS _id,
            sum(view_count) AS total_view_count
          FROM
            (${viewsTable}) q
          WHERE
            ${generateOrConditionQuery("post_id", batch)}
          GROUP BY
            post_id;
        `,
          batch
        );

        viewsResults.push(...viewsResult);
      }

      async function runReadsQuery(batch: string[]) {
        // console.log(`
        //   SELECT
        //     post_id AS _id,
        //     -- A "read" is anything with a reading_time over 30 seconds
        //     sum(CASE WHEN reading_time > 30 THEN 1 ELSE 0 END) AS total_read_count
        //   FROM
        //     (${postViewTimesTable}) q
        //   WHERE
        //     ${generateOrConditionQuery("post_id", batch)}
        //   GROUP BY
        //     post_id;
        // `)
        const readsResult = await analyticsDb.any<{ _id: string; total_read_count: number }>(
          `
          SELECT
            post_id AS _id,
            -- A "read" is anything with a reading_time over 30 seconds
            sum(CASE WHEN reading_time > 30 THEN 1 ELSE 0 END) AS total_read_count
          FROM
            (${postViewTimesTable}) q
          WHERE
            ${generateOrConditionQuery("post_id", batch)}
          GROUP BY
            post_id;
        `,
          batch
        );

        readsResults.push(...readsResult);
      }

      // Pair batches of ids with their corresponding query functions and then zip these pairs together
      const zippedPairs = postIdsBatches.flatMap((batch) => [
        { batch, func: runViewsQuery },
        { batch, func: runReadsQuery },
      ]);

      let queue: Promise<any>[] = [];

      // Execute up to maxConcurrent queries at a time
      for (const { batch, func } of zippedPairs) {
        // Add the new promise to the queue
        const promise = func(batch);
        queue.push(promise);

        // If the queue is full, wait for one promise to finish
        if (queue.length >= MAX_CONCURRENT_QUERIES) {
          await Promise.race(queue);
          // Remove resolved promises from the queue
          queue = queue.filter((p) => inspect(p).includes("pending"));
        }
      }

      // Wait for all remaining promises to finish
      await Promise.all(queue);

      // Flatten the results
      const viewsById = Object.fromEntries(viewsResults.map((row) => [row._id, row.total_view_count]));
      const readsById = Object.fromEntries(readsResults.map((row) => [row._id, row.total_read_count]));

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
          reads: readsById[_id] ?? 0,
          karma: postsById[_id].baseScore,
          comments: postsById[_id].commentCount ?? 0,
        };
      });

      return {
        posts: posts,
        totalCount: await postCountPromise,
      };
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
    reads: Int
    karma: Int
    comments: Int
  }

  type AuthorAnalyticsResult {
    posts: [PostAnalytics2Result]
    totalCount: Int!
  }
`);

addGraphQLQuery("PostAnalytics(postId: String!): PostAnalyticsResult!");
addGraphQLQuery("AuthorAnalytics(userId: String!, sortBy: String, desc: Boolean, limit: Int): AuthorAnalyticsResult!");
