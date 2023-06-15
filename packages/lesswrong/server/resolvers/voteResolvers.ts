import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../../lib/vulcan-lib/graphql";
import { VotesRepo } from "../repos";

addGraphQLResolvers({
  Query: {
    async UserVoteHistory(root: void, args: {limit: number|undefined}, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Must be logged in to view read history')
      }
      
      const votesReo = new VotesRepo()
      return votesReo.getRecentUserVotedOnContent(currentUser._id, args.limit ?? 10)
      // const posts = content.filter(item => item.content_type === 'post');
      // const comments = content.filter(item => item.content_type === 'comment');
      // return content;
    }
  }
});

addGraphQLSchema(`
  type UserVoteHistoryResult {
    comments: [Comment!]
    posts: [Post!]
    voteInfo: JSON
  }
`);

addGraphQLQuery('UserVoteHistory(limit: Int): UserVoteHistoryResult')
