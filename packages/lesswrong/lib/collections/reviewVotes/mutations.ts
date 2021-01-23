import { Utils, addGraphQLMutation, addGraphQLResolvers } from '../../vulcan-lib';
import { accessFilterSingle } from '../../utils/schemaUtils';
import { Posts } from '../posts/collection'
import { ReviewVotes } from './collection'

addGraphQLResolvers({
  Mutation: {
    submitReviewVote: async (root: void, args: { postId: string, qualitativeScore: number, quadraticChange: number, newQuadraticScore: number, comment: string, year: string, dummy: boolean, reactions: string[] }, context: ResolverContext) => {
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
        const newVote = await Utils.createMutator({
          collection: ReviewVotes,
          document: { postId, qualitativeScore, quadraticScore: finalQuadraticScore, comment, year, dummy, reactions },
          validate: false,
          currentUser,
        });
        return newVote.data;
      } else {
        await ReviewVotes.update(
          {_id: existingVote._id}, 
          {
            $set: {
              postId, 
              qualitativeScore, 
              comment, 
              year,
              dummy,
              reactions,
              ...((typeof newQuadraticScore==='number') && {
                quadraticScore: newQuadraticScore
              })
            },
            ...(quadraticChange && !(typeof newQuadraticScore==='number') && {$inc: {
              quadraticScore: quadraticChange
            }})
          }
        )
        const newVote = await ReviewVotes.findOne({_id: existingVote._id})
        return newVote;
      }
    }
  }
});
addGraphQLMutation('submitReviewVote(postId: String, qualitativeScore: Int, quadraticChange: Int, newQuadraticScore: Int, comment: String, year: String, dummy: Boolean, reactions: [String]): ReviewVote');
