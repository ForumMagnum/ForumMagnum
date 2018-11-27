/*

GraphQL config

*/

import { addGraphQLMutation, addGraphQLResolvers, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";
import { Utils } from 'meteor/vulcan:core';

const specificResolvers = {
  Mutation: {
    moderateComment(root, { commentId, deleted, deletedPublic, deletedReason}, context) {
      const comment = context.Comments.findOne(commentId)
      const post = context.Posts.findOne(comment.postId)

      if (Users.canModeratePost(context.currentUser, post)) {

        let set = {deleted: deleted}
        if (deleted) {
          set.deletedPublic = deletedPublic;
          set.deletedDate = comment.deletedDate || new Date();
          set.deletedReason = deletedReason;
          set.deletedByUserId = context.currentUser._id;
        } else { //When you undo delete, reset all delete-related fields
          set.deletedPublic = false;
          set.deletedDate = null;
          set.deletedReason = "";
          set.deletedByUserId = null;
        }
        let modifier = { $set: set };
        modifier = runCallbacks('comments.moderate.sync', modifier);
        context.Comments.update({_id: commentId}, modifier);
        const updatedComment = context.Comments.findOne(commentId)
        runCallbacksAsync('comments.moderate.async', updatedComment, comment, context);
        return context.Users.restrictViewableFields(context.currentUser, context.Comments, updatedComment);
      } else {
        throw new Error(Utils.encodeIntlError({id: `app.user_cannot_moderate_post`}));
      }
    },
    retractComment(root, { commentId, retracted }, context) {
      const comment = context.Comments.findOne(commentId);
      
      if (Users.owns(context.currentUser, comment)) {
        let set = {retracted: retracted};
        // TODO: retractedDate field?
        context.Comments.update({_id: commentId}, {$set: set});
        
        const updatedComment = context.Comments.findOne(commentId)
        return context.Users.restrictViewableFields(context.currentUser, context.Comments, updatedComment);
      } else {
        throw new Error("You can't retract or un-retract a comment you didn't write");
      }
    },
  }
};

addGraphQLResolvers(specificResolvers);
addGraphQLMutation('moderateComment(commentId: String, deleted: Boolean, deletedPublic: Boolean, deletedReason: String): Comment');
addGraphQLMutation('retractComment(commentId: String, retracted: Boolean): Comment');
