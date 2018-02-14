/*

GraphQL config

*/

import { addGraphQLMutation, addGraphQLResolvers, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";

const specificResolvers = {
  Mutation: {
    moderateComment(root, { commentId, deleted}, context) {
      const comment = context.Comments.findOne(commentId)
      const post = context.Posts.findOne(comment.postId)
      if (Users.canModeratePost(context.currentUser, post)) {
        let modifier = {$set: {deleted: deleted}};
        modifier = runCallbacks('comments.moderate.sync', modifier);
        context.Comments.update({_id: commentId}, modifier);
        const updatedComment = context.Comments.findOne(commentId);
        runCallbacksAsync('comments.moderate.async', updatedComment, comment, context);
        return updatedComment;
      } else {
        throw new Error({id: `app.user_cannot_moderate_post`});
      }
    }
  }
};

addGraphQLResolvers(specificResolvers);
addGraphQLMutation('moderateComment(commentId: String, deleted: Boolean): Comment');
