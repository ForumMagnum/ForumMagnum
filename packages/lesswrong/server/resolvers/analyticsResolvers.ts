import { PostAnalyticsResult } from "../../components/hooks/usePostAnalytics";
import { isEAForum } from "../../lib/instanceSettings";
import { getAnalyticsConnection } from "../analytics/postgresConnection";
import  camelCase  from "lodash/camelCase";
import { canUserEditPostMetadata } from "../../lib/collections/posts/helpers";
import { AnalyticsSeriesValue, MultiPostAnalyticsResult, PostAnalytics2Result } from "../../components/hooks/useAnalytics";
import Posts from "../../server/collections/posts/collection";
import { userIsAdminOrMod } from "../../lib/vulcan-users/permissions";
import moment from "moment";
import groupBy from "lodash/groupBy";
import { generateDateSeries } from "../../lib/helpers";
import gql from "graphql-tag";

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

export const analyticsGraphQLTypeDefs = gql`
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
  type AnalyticsSeriesValue {
    date: Date
    views: Int
    reads: Int
    karma: Int
    comments: Int
  }
  extend type Query {
    PostAnalytics(postId: String!): PostAnalyticsResult!
    MultiPostAnalytics(userId: String, postIds: [String], sortBy: String, desc: Boolean, limit: Int): MultiPostAnalyticsResult!
    AnalyticsSeries(userId: String, postIds: [String], startDate: Date, endDate: Date): [AnalyticsSeriesValue]
  }
`

export const analyticsGraphQLQueries = {
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
    if (!isEAForum && !currentUser.isAdmin) {
      throw new Error("Permission denied");
    }
    // Maybe check for karma level here?
    if (
      !canUserEditPostMetadata(currentUser, post) &&
      !currentUser.groups?.includes("sunshineRegiment")
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
    }: { userId: string; postIds: string[] | null; sortBy: string | null; desc: boolean | null; limit: number | null },
    context: ResolverContext
  ): Promise<MultiPostAnalyticsResult> {
    // These are null (not undefined) if not provided, so we have to explicitly set them to the default
    sortBy = sortBy ?? "postedAt";
    desc = desc ?? true;
    limit = limit ?? 10;

    // Directly sortable fields can be sorted and filtered on before querying the analytics database,
    // so we can avoid querying for most of the post ids. Indirectly sortable fields are calculated
    // rely on the results from the analytics database, so we have to query for all the post ids and then
    // sort and filter afterwards.
    const DIRECTLY_SORTABLE_FIELDS = ["postedAt", "baseScore", "commentCount"];
    const INDIRECTLY_SORTABLE_FIELDS = ["views", "reads"];

    const { currentUser } = context;

    const directlySortable = DIRECTLY_SORTABLE_FIELDS.includes(sortBy);

    const postSelector = {
      ...(userId && {$or: [{ userId: userId }, { "coauthorStatuses.userId": userId }]}),
      ...(postIdsInput && { _id: { $in: postIdsInput } }),
      rejected: { $ne: true },
      draft: false,
      isEvent: false,
    };
    const postCountPromise = Posts.find(postSelector).count();
    const rawPosts = await Posts.find(postSelector, {
      ...(directlySortable && { sort: { [sortBy]: desc ? -1 : 1 } }),
      ...(directlySortable && { limit }),
    }).fetch();

    const filteredPosts = rawPosts.filter((post) =>
      userIsAdminOrMod(currentUser) || canUserEditPostMetadata(currentUser, post)
    );

    const postsById = Object.fromEntries(filteredPosts.map((post) => [post._id, post]));
    const postIds = filteredPosts.map((post) => post._id);

    if (!postIds.length) {
      return {
        posts: [],
        totalCount: 0,
      };
    }

    const [viewsResults, readsResults] = await Promise.all([
      context.repos.postViews.viewsByPost({postIds}),
      context.repos.postViewTimes.readsByPost({postIds}),
    ]);

    // Flatten the results
    const viewsById = Object.fromEntries(viewsResults.map((row) => [row.postId, row.totalViews]));
    const uniqueViewsById = Object.fromEntries(viewsResults.map((row) => [row.postId, row.totalUniqueViews]));
    const readsById = Object.fromEntries(readsResults.map((row) => [row.postId, row.totalReads]));
    const meanReadingTimeById = Object.fromEntries(readsResults.map((row) => [row.postId, row.meanReadTime]));

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
    }: {
      userId: string | null;
      postIds: string[] | null;
      startDate: Date | null;
      endDate: Date | null;
    },
    context: ResolverContext
  ): Promise<AnalyticsSeriesValue[]> {
    const { currentUser } = context;

    if (!userId && (!postIds || !postIds.length)) {
      throw new Error("Must provide either userId or postIds");
    }
    if (!endDate) {
      throw new Error("Must provide endDate");
    }
  
    // Round start date down to nearest day in UTC
    const adjustedStartDate = startDate ? moment(new Date(startDate)).utc().startOf("day") : undefined;
    const adjustedEndDate = moment(new Date(endDate)).utc().add(1, "days").startOf("day");

    const postSelector = {
      ...(userId && {$or: [{ userId: userId }, { "coauthorStatuses.userId": userId }]}),
      ...(postIds && { _id: { $in: postIds } }),
      rejected: { $ne: true },
      draft: false,
      isEvent: false,
    }
    const rawPosts = await Posts.find(postSelector).fetch();
    const filteredPosts = rawPosts.filter(
      (post) => userIsAdminOrMod(currentUser) || canUserEditPostMetadata(currentUser, post)
    );
    const queryPostIds = filteredPosts.map((post) => post._id);

    if (!queryPostIds.length) {
      return [];
    }

    const [viewRes, readRes, karmaRes, commentRes] = await Promise.all([
      context.repos.postViews.viewsByDate({
        postIds: queryPostIds,
        startDate: adjustedStartDate?.toDate(),
        endDate: adjustedEndDate.toDate(),
      }),
      context.repos.postViewTimes.readsByDate({
        postIds: queryPostIds,
        startDate: adjustedStartDate?.toDate(),
        endDate: adjustedEndDate.toDate(),
      }),
      context.repos.votes.getDocumentKarmaChangePerDay({
        documentIds: queryPostIds,
        startDate: adjustedStartDate?.toDate(),
        endDate: adjustedEndDate.toDate(),
      }),
      context.repos.comments.getCommentsPerDay({
        postIds: queryPostIds,
        startDate: adjustedStartDate?.toDate(),
        endDate: adjustedEndDate.toDate(),
      }),
    ]);

    const viewsByDate = groupBy(viewRes, "date");
    const readsByDate = groupBy(readRes, "date");
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
      views: viewsByDate[date]?.reduce((acc, curr) => acc + (curr.totalViews ?? 0), 0) ?? 0,
      reads: readsByDate[date]?.reduce((acc, curr) => acc + (curr.totalReads ?? 0), 0) ?? 0,
      karma: karmaByDate[date]?.reduce((acc, curr) => acc + parseInt(curr.karma_change ?? 0), 0) ?? 0,
      comments: commentsByDate[date]?.reduce((acc, curr) => acc + parseInt(curr.comment_count ?? 0), 0) ?? 0
    }));
    // Remove leading values where all fields are 0
    const truncatedResult = result.slice(result.findIndex((value) => (
      value.views !== 0 || value.reads !== 0 || value.karma !== 0 || value.comments !== 0
    )));
    return truncatedResult;
  },
}