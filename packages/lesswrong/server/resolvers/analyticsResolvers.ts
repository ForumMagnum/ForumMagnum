import { userOwns } from "../../lib/vulcan-users";
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../vulcan-lib";
import { getAnalyticsConnection } from "../analytics/postgresConnection";
import { queryResult } from "pg-promise";

export type PostMetricsResult = {
  uniqueClientViews: number;
};

addGraphQLResolvers({
  Query: {
    async PostMetrics(root: void, { postId }: { postId: string }, context: ResolverContext) {
      const { currentUser } = context;
      if (!currentUser) throw new Error(`No user`);
      const post = await context.loaders.Posts.load(postId);
      // check that the current user has permission to view post metrics
      // TODO; should maybe first test if user has something like Trust Level 1 (e.g. 1k karma)?
      if (!userOwns(currentUser, post) && !currentUser.isAdmin && currentUser.groups.includes("sunshineRegiment")) {
        throw new Error("Permission denied");
      }

      const postgres = getAnalyticsConnection();
      if (!postgres) throw new Error("Unable to connect to analytics database - no database configured");

      // TODO; update if we update the post_timer_event view?
      const queryStr = `
        SELECT
          count(distinct clientid) as unique_client_views
        FROM post_timer_event
        WHERE post_id = $1
      `;
      const queryVars = [postId];

      const result = await postgres.query(queryStr, queryVars);

      return {
        uniqueClientViews: result.unique_client_views,
      };
    },
  },
});

addGraphQLSchema(`
  type PostMetricsResult {
    uniqueClientViews: Number
  }
`);

addGraphQLQuery("PostMetrics(postId: String!): [PostMetricsResult!]");
