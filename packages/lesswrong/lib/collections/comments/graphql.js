/*

GraphQL config

*/

import { addGraphQLMutation, addGraphQLResolvers, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";

const specificResolvers = {
  Mutation: {
    moderateComment(root, { commentId, deleted, deletedPublic, deletedReason}, context) {
      const comment = context.Comments.findOne(commentId)
      const post = context.Posts.findOne(comment.postId)

      if (Users.canModeratePost(context.currentUser, post)) {

        let set = {deleted: deleted}
        let unset = {};
        if (deleted) {
          set.deletedPublic = deletedPublic;
          set.deletedDate = comment.deletedDate || new Date();
          set.deletedReason = deletedReason;
          set.deletedByUserId = context.currentUser._id;
        } else {
          unset = {
            deletedPublic: true,
            deletedDate: true,
            deletedReason: true,
            deletedByUserId: true
          }
        }

        let modifier = { $set: set, $unset: unset};
        modifier = runCallbacks('comments.moderate.sync', modifier);
        context.Comments.update({_id: commentId}, modifier);
        const updatedComment = context.Comments.findOne(commentId)
        runCallbacksAsync('comments.moderate.async', updatedComment, comment, context);
        return context.Users.restrictViewableFields(context.currentUser, context.Comments, updatedComment);
      } else {
        throw new Error({id: `app.user_cannot_moderate_post`});
      }
    }
  }
};

addGraphQLResolvers(specificResolvers);
addGraphQLMutation('moderateComment(commentId: String, deleted: Boolean, deletedPublic: Boolean, deletedReason: String): Comment');
