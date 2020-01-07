import { newMutation, editMutation, addGraphQLMutation, addGraphQLResolvers } from 'meteor/vulcan:core';
import { accessFilterSingle } from '../../utils/schemaUtils';
import { Posts } from '../posts/collection'
import { ReviewVotes } from './collection'

addGraphQLResolvers({
  Mutation: {
    submitReviewVote: async (root, { postId, qualitativeScore, quadraticScore, comment }, { currentUser }) => {
      if (!currentUser) throw new Error("You must be logged in to submit a review vote");
      if (!postId) throw new Error("Missing argument: postId");
      
      const post = Posts.findOne({_id: postId});
      if (!accessFilterSingle(currentUser, Posts, post))
        throw new Error("Invalid postId");
      
      // Check whether this post already has a review vote
      const existingVote = ReviewVotes.findOne({ postId, userId: currentUser._id });
      if (!existingVote) {
        const newVote = await newMutation({
          collection: ReviewVotes,
          document: { postId, qualitativeScore, quadraticScore, comment },
          validate: false,
          currentUser,
        });
        return newVote.data;
      } else {
        // Upvote the tag
        // TODO: Don't *remove* an upvote in this case
        const updatedVote = await editMutation({
            collection: ReviewVotes,
            documentId: existingVote._id,
            set: { postId, qualitativeScore, quadraticScore, comment },
            unset: {},
            validate: false,
        });
        return updatedVote.data;
      }
    }
  }
});
addGraphQLMutation('submitReviewVote(postId: String, qualitativeScore: Int, quadraticScore: Int, comment: String): ReviewVote');
