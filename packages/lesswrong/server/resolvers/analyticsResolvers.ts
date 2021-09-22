import { userOwns } from "../../lib/vulcan-users"
import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../vulcan-lib"
import { getAnalyticsConnection } from "../analytics/postgresConnection"
import { forumTypeSetting } from "../../lib/instanceSettings"
import { PostMetricsResult } from "../../components/posts/usePostMetrics"
import mapValues from 'lodash/mapValues'

// TODO; result columns?
function makePgAnalyticsQuery (query: string, resultColumn: string) {
  return async (post: DbPost) => {
    const postgres = getAnalyticsConnection()
    if (!postgres) throw new Error("Unable to connect to analytics database - no database configured")

    const queryVars = [post._id]

    const pgResult = await postgres.query(query, queryVars)
    
    if (!pgResult.length) {
      throw new Error(`No data found for post ${post.title}`)
    }
    if (pgResult.length > 1) {
      throw new Error(`Multiple rows found for post ${post.title}`)
    }
    const result = pgResult[0][resultColumn]
    return result
  }
}

type QueryFunc = (post: DbPost) => Promise<Partial<PostMetricsResult>>

const queries: Record<keyof PostMetricsResult, QueryFunc> = {
  uniqueClientViews: makePgAnalyticsQuery(
    `
      SELECT COUNT(DISTINCT client_id) AS unique_client_views
      FROM page_view
      WHERE post_id = $1
        AND client_id IS NOT NULL
    `,
    'unique_client_views'
  ),
  // TODO; implement median function and change avg call to use it
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
    'unique_client_views_10_sec'
  ),
}

addGraphQLResolvers({
  Query: {
    async PostMetrics(root: void, { postId }: { postId: string }, context: ResolverContext): Promise<PostMetricsResult> {
      const { currentUser } = context
      if (!currentUser) throw new Error(`No user`)
      const post = await context.loaders.Posts.load(postId)
      // check that the current user has permission to view post metrics
      // LW doesn't want to show this to authors, but we'll let admins see it
      if (forumTypeSetting.get() !== "EAForum" && !currentUser.isAdmin) {
        throw new Error("Permission denied")
      }
      // TODO; should maybe first test if user has something like Trust Level 1 (e.g. 1k karma)?
      if (!userOwns(currentUser, post) && !currentUser.isAdmin && !currentUser.groups.includes("sunshineRegiment")) {
        throw new Error("Permission denied")
      }
      
      // I really wanted to do this as a map, but I want to do this in serial,
      // and couldn't get it to work the way I wanted
      const postMetrics: Partial<PostMetricsResult> = {}
      for (const [key, queryFunc] of Object.entries(queries)) {
        postMetrics[key] = await queryFunc(post)
      }
      
      // There's no good way to tell TS that because we've iterated over all the
      // keys, the partial is no longer partial
      return postMetrics as PostMetricsResult
    },
  },
})

addGraphQLSchema(`
  type PostMetricsResult {
    uniqueClientViews: Int
    uniqueClientViews10Sec: Int
  }
`)

addGraphQLQuery("PostMetrics(postId: String!): PostMetricsResult!")
