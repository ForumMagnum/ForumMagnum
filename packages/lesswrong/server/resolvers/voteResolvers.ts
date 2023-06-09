import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from '../vulcan-lib';
import { VotesRepo } from '../repos';


addGraphQLResolvers({
  Query: {
    async DigestPlannerVotes(root: void, args: {postIds: string[]}, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser || !currentUser.isAdmin) {
        throw new Error('Permission denied')
      }
      
      const votesRepo = new VotesRepo()
      return await votesRepo.getDigestPlannerVotesForPosts(args.postIds)
    }
  }
})

addGraphQLSchema(`
  type DigestPlannerVotesCounts {
    postId: String
    upvoteCount: Int
    downvoteCount: Int
  }
`)
addGraphQLQuery('DigestPlannerVotes(postIds: [String]): [DigestPlannerVotesCounts]')
