import { newMutation, addGraphQLMutation, addGraphQLResolvers } from 'meteor/vulcan:core';
import { accessFilterSingle } from '../../utils/schemaUtils';
import { Posts } from '../posts/collection'
import { ReviewVotes } from './collection'

addGraphQLResolvers({
  Mutation: {
    submitReviewVote: async (root, { postId, qualitativeScore, quadraticChange, setQuadraticScore, comment }, { currentUser }) => {
      if (!currentUser) throw new Error("You must be logged in to submit a review vote");
      if (!postId) throw new Error("Missing argument: postId");
      
      const post = Posts.findOne({_id: postId});
      if (!accessFilterSingle(currentUser, Posts, post))
        throw new Error("Invalid postId");
      
      // Check whether this post already has a review vote
      const existingVote = ReviewVotes.findOne({ postId, userId: currentUser._id });
      const newQuadraticScore = (typeof setQuadraticScore !== 'undefined' ) ? setQuadraticScore : (existingVote?.quadraticScore || 0) + (quadraticChange || 0)
      if (!existingVote) {
        const newVote = await newMutation({
          collection: ReviewVotes,
          document: { postId, qualitativeScore, quadraticScore: newQuadraticScore, comment },
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
              quadraticScore: setQuadraticScore
            },
            ...(quadraticChange && {$inc: {
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
addGraphQLMutation('submitReviewVote(postId: String, qualitativeScore: Int, quadraticChange: Int, setQuadraticScore: Int, comment: String): ReviewVote');
