/*

GraphQL config

*/

import { addGraphQLMutation, addGraphQLResolvers, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";

const alignmentCommentResolvers = {
  Mutation: {
    alignmentComment(root, { commentId, af }, context) {
      const comment = context.Comments.findOne(commentId)

      if (Users.canDo(context.currentUser, "comments.alignment.move.all")) {
        let modifier = { $set: {af: af} };
        modifier = runCallbacks('comments.alignment.sync', modifier);
        context.Comments.update({_id: commentId}, modifier);
        const updatedComment = context.Comments.findOne(commentId)
        runCallbacksAsync('comments.alignment.async', updatedComment, comment, context);
        return context.Users.restrictViewableFields(context.currentUser, context.Comments, updatedComment);
      } else {
        throw new Error({id: `app.user_cannot_edit_comment_alignment_forum_status`});
      }
    }
  }
};

addGraphQLResolvers(alignmentCommentResolvers);
addGraphQLMutation('alignmentComment(commentId: String, af: Boolean): Comment');


const alignmentPostResolvers = {
  Mutation: {
    alignmentPost(root, { postId, af }, context) {
      const post = context.Posts.findOne(postId)

      if (Users.canDo(context.currentUser, "posts.alignment.move.all")) {
        let modifier = { $set: {af: af} };
        modifier = runCallbacks('posts.alignment.sync', modifier);
        context.Posts.update({_id: postId}, modifier);
        const updatedPost = context.Posts.findOne(postId)
        runCallbacksAsync('posts.alignment.async', updatedPost, post, context);
        return context.Users.restrictViewableFields(context.currentUser, context.Posts, updatedPost);
      } else {
        throw new Error({id: `app.user_cannot_edit_post_alignment_forum_status`});
      }
    }
  }
};

addGraphQLResolvers(alignmentPostResolvers);
addGraphQLMutation('alignmentPost(postId: String, af: Boolean): Post');
