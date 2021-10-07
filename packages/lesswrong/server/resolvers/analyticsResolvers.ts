import { PostAnalyticsResult } from "../../components/posts/usePostAnalytics";
import { forumTypeSetting } from "../../lib/instanceSettings";
import { userOwns } from "../../lib/vulcan-users";
import { getAnalyticsConnection } from "../analytics/postgresConnection";
import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../vulcan-lib";

// TODO: Result column means you can't have a single query return multiple
// results. But getting everything to work with columns plural was tricky and I
// didn't need it.
/**
 * Based on an analytics query, returns a function that runs that query
 */
function makePgAnalyticsQuery(query: string, resultColumn: string) {
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
    const result = pgResult[0][resultColumn];
    return result;
  };
}

type QueryFunc = (post: DbPost) => Promise<Partial<PostAnalyticsResult>>;

const queries: Partial<Record<keyof PostAnalyticsResult, QueryFunc>> = {
  uniqueClientViews: makePgAnalyticsQuery(
    `
      SELECT COUNT(DISTINCT client_id) AS unique_client_views
      FROM page_view
      WHERE post_id = $1
        AND client_id IS NOT NULL
    `,
    "unique_client_views"
  ),
  // TODO: implement median function and change avg call to use it
  uniqueClientViews10Sec: makePgAnalyticsQuery(
    `
      SELECT
        count(*) as unique_client_views_10_sec,
        avg(max_reading_time) as median_reading_time
      FROM (
        SELECT
          client_id,
          max(seconds) as max_reading_time
        FROM event_timer_event
        WHERE post_id = $1
          AND client_id IS NOT NULL
        GROUP BY client_id
      ) a
    `,
    "unique_client_views_10_sec"
  ),
};

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
      if (!userOwns(currentUser, post) && !currentUser.isAdmin && !currentUser.groups.includes("sunshineRegiment")) {
        throw new Error("Permission denied");
      }

      // I really wanted to do this as a map, but I want to do this in serial,
      // and couldn't get it to work the way I wanted
      const postAnalytics: Partial<PostAnalyticsResult> = {};
      for (const [key, queryFunc] of Object.entries(queries)) {
        if (!queryFunc) continue;
        postAnalytics[key] = await queryFunc(post);
      }
      
      // TODO; refactor
      const postgres = getAnalyticsConnection();
      if (!postgres) throw new Error("Unable to connect to analytics database - no database configured");
      
      // a masterpiece
      const query = `
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
          WHERE unique_client_views.unique_client_views > 1
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
      `;
      
      const uniqueClientViewsSeries = await postgres.query(query, [post._id]);
      
      if (!uniqueClientViewsSeries.length) {
        throw new Error(`No data found for post ${post.title}`);
      }
      
      postAnalytics["uniqueClientViewsSeries"] = uniqueClientViewsSeries.map((row: any) => ({
        uniqueClientViews: row.unique_client_views,
        date: row.date,
      }))

      // There's no good way to tell TS that because we've iterated over all the
      // keys, the partial is no longer partial
      return postAnalytics as PostAnalyticsResult;
    },
  },
});

addGraphQLSchema(`
  type UniqueClientViewsSeries {
    uniqueClientViews: Int
    date: Date
  }

  type PostAnalyticsResult {
    uniqueClientViews: Int
    uniqueClientViews10Sec: Int
    uniqueClientViewsSeries: [UniqueClientViewsSeries]
  }
`);

addGraphQLQuery("PostAnalytics(postId: String!): PostAnalyticsResult!");
