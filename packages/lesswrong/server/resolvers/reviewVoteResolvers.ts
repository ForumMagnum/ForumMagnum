import { addGraphQLMutation, addGraphQLResolvers } from '../../lib/vulcan-lib/graphql';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { Posts } from '../../lib/collections/posts/collection'
import { ReviewVotes } from '../../lib/collections/reviewVotes/collection'

addGraphQLResolvers({
  Mutation: {

    // This mutation returns a post, with the reviewVote included as a field, so that we can get a fast-response-time on the list of ReviewVoteTableRows in ReviewVotingPage.
    
    submitReviewVote: async (root: void, args: { postId: string, qualitativeScore: number, quadraticChange: number, newQuadraticScore: number, comment: string, year: string, dummy: boolean, reactions: string[] }, context: ResolverContext): Promise<DbPost> =>  {
      const { postId, qualitativeScore, quadraticChange, newQuadraticScore, comment, year, dummy, reactions } = args;
      const { currentUser } = context;
      if (!currentUser) throw new Error("You must be logged in to submit a review vote");
      if (!postId) throw new Error("Missing argument: postId");
      
      const post = await Posts.findOne({_id: postId});
      if (!await accessFilterSingle(currentUser, Posts, post, context))
        throw new Error("Invalid postId");
      
      // Check whether this post already has a review vote
      const existingVote = await ReviewVotes.findOne({ postId, userId: currentUser._id });
      if (!existingVote) {
        const finalQuadraticScore = (typeof newQuadraticScore !== 'undefined' ) ? newQuadraticScore : (quadraticChange || 0)
        const newVote = await createMutator({
          collection: ReviewVotes,
          document: { postId, qualitativeScore, quadraticScore: finalQuadraticScore, comment, year, dummy, reactions },
          validate: false,
          currentUser,
        });
        const newPost = await Posts.findOne({_id:postId})
        if (!newPost) throw Error("Can't find post corresponding to Review Vote")
        return newPost
      } else {
        // TODO:(Review) this could potentially introduce a race condition where
        // the user does two increments in a row and the second read happens
        // before the first write, leading to the discarding of the first
        // increment. We should consider adding an increment option to
        // updateMutator 
        const finalQuadraticScore = typeof newQuadraticScore !== 'undefined' ?
          newQuadraticScore :
          existingVote.quadraticScore + (quadraticChange || 0)
        await updateMutator({
          collection: ReviewVotes,
          documentId: existingVote._id,
          set: {
            postId, 
            qualitativeScore, 
            comment, 
            year,
            dummy,
            reactions,
            quadraticScore: finalQuadraticScore
          },
          validate: false,
          currentUser,
        })
        const newPost = await Posts.findOne({_id:postId})
        if (!newPost) throw Error("Can't find post corresponding to Review Vote")
        return newPost 
      }
    }
  }
});
addGraphQLMutation('submitReviewVote(postId: String, qualitativeScore: Int, quadraticChange: Int, newQuadraticScore: Int, comment: String, year: String, dummy: Boolean, reactions: [String]): Post');
