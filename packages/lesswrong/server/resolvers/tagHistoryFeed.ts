import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';

addGraphQLResolvers({
  Query: {
    async TagHistoryFeed(root, args: {tagId: string, limit?: number, after?: Date, context: ResolverContext) {
      const {tagId, limit, after} = args;
      return mergeFeedQueries({
        limit, after,
        queries: [
          {
            sortKey: 
            doQuery: (limit, after) => {
            },
          },
        ],
      });
    }
  },
});

addGraphQLSchema(`
  type TagHistoryFeedSchema {
    type: String!
    tagCreated: TagHistoryCreated
    tagRevision: TagHistoryRevision
    tagApplied: TagHistoryApplied
  }
  type TagHistoryCreated {
    date: Date!
    user: User!
  }
  type TagHistoryRevision {
    date: Date!
    user: User!
  }
  type TagHistoryApplied {
    date: Date!
    user: User!
    post: Post!
  }
`);
addGraphQLQuery("TagHistoryFeed(tagId: String!, limit: Int, after: Date): TagHistoryFeedSchema");


function mergeFeedQueries({limit, after, queries}: {
  limit: number
  after: 
  queries: Array<{
    
  }>
}) => {
  
}
