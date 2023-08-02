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
      { userId }: { userId: string },
      context: ResolverContext
    ): Promise<AuthorAnalyticsResult> {
      const { currentUser } = context;

      if (currentUser?._id !== userId && !userIsAdminOrMod(currentUser)) {
        throw new Error("Permission denied");
      }

      const userPosts = await Posts.find({
        $or: [{userId: userId}, {"coauthorStatuses.userId": userId}],
        rejected: {$ne: true},
        draft: false,
        isEvent: false,
      }, {projection: {
        _id: 1,
        title: 1,
        slug: 1,
        postedAt: 1,
        baseScore: 1,
        commentCount: 1,
      }}).fetch()

      const postsById = Object.fromEntries(userPosts.map(post => [post._id, post]))
      const postIds = userPosts.map(post => post._id)

      if (!postIds.length) {
        return {
          posts: []
        }
      }

      const postViewsView = getHybridView("post_views");
      const postViewTimesView = getHybridView("post_view_times");
      if (!postViewsView || !postViewTimesView) throw new Error("Hybrid views not configured");

      const analyticsDb = getAnalyticsConnectionOrThrow();

      const viewsTable = await postViewsView.virtualTable();
      const viewsResult = await analyticsDb.any<{_id: string, total_view_count: number}>(`
        SELECT
          post_id AS _id,
          sum(view_count) AS total_view_count
        FROM
          (${viewsTable}) q
        WHERE
          post_id IN ( $1:csv )
        GROUP BY
          post_id;
      `, [postIds]);

      const postViewTimesTable = await postViewTimesView.virtualTable();
      // Note that this currently double counts reads from the same client that
      // happen on different days. I think this is an ok tradeoff to be able to
      // get consistent results for reads per day more easily
      const readsResult = await analyticsDb.any<{_id: string, total_read_count: number}>(`
        SELECT
          post_id AS _id,
          -- A "read" is anything with a reading_time over 30 seconds
          sum(CASE WHEN reading_time > 30 THEN 1 ELSE 0 END) AS total_read_count
        FROM
          (${postViewTimesTable}) q
        WHERE
          post_id IN ( $1:csv )
        GROUP BY
          post_id;
      `, [postIds]);

      // TODO base this on postsById instead of viewsResult
      const posts: PostAnalytics2Result[] = viewsResult.map((row, idx) => {
        return {
          _id: row._id,
          title: postsById[row._id].title,
          slug: postsById[row._id].slug,
          postedAt: postsById[row._id].postedAt,
          views: row.total_view_count,
          reads: readsResult[idx]?.total_read_count ?? 0,
          karma: postsById[row._id].baseScore,
          comments: postsById[row._id].commentCount ?? 0,
        }
      })

      return {
        posts: posts
       } as AuthorAnalyticsResult;
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
  }
`);

addGraphQLQuery("PostAnalytics(postId: String!): PostAnalyticsResult!");
addGraphQLQuery("AuthorAnalytics(userId: String!): AuthorAnalyticsResult!");
