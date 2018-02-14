/*

GraphQL config

*/

import { addGraphQLMutation, addGraphQLResolvers } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";

const specificResolvers = {
  Mutation: {
    moderateComment(root, { commentId, deleted}, context) {
      const comment = context.Comments.findOne(commentId)
      const post = context.Posts.findOne(comment.postId)
      if (Users.canModeratePost(context.currentUser, post)) {
        context.Comments.update({_id: commentId}, { $set: { deleted: deleted }});
        return context.Comments.findOne(commentId)
      } else {
        throw new Error({id: `app.user_cannot_moderate_post`});
      }
    }
  }
};

addGraphQLResolvers(specificResolvers);
addGraphQLMutation('moderateComment(commentId: String, deleted: Boolean): Comment');
