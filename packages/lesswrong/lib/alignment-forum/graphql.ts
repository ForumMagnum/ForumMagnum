/*

GraphQL config

*/

import { addGraphQLMutation, addGraphQLResolvers, runCallbacks, runCallbacksAsync } from '../vulcan-lib';
import Users from "../collections/users/collection";
import { accessFilterSingle } from '../utils/schemaUtils';

const alignmentCommentResolvers = {
  Mutation: {
    async alignmentComment(root, { commentId, af }, context: ResolverContext) {
      const comment = context.Comments.findOne(commentId)

      if (Users.canDo(context.currentUser, "comments.alignment.move.all")) {
        let modifier = { $set: {af: af} };
        modifier = runCallbacks('comments.alignment.sync', modifier);
        context.Comments.update({_id: commentId}, modifier);
        const updatedComment = context.Comments.findOne(commentId)
        runCallbacksAsync('comments.alignment.async', updatedComment, comment, context);
        return await accessFilterSingle(context.currentUser, context.Comments, updatedComment, context);
      } else {
        throw new Error({id: `app.user_cannot_edit_comment_alignment_forum_status`} as any);
      }
    }
  }
};

addGraphQLResolvers(alignmentCommentResolvers);
addGraphQLMutation('alignmentComment(commentId: String, af: Boolean): Comment');


const alignmentPostResolvers = {
  Mutation: {
    async alignmentPost(root, { postId, af }, context: ResolverContext) {
      const post = context.Posts.findOne(postId)

      if (Users.canMakeAlignmentPost(context.currentUser, post)) {
        let modifier = { $set: {af: af} };
        modifier = runCallbacks('posts.alignment.sync', modifier);
        context.Posts.update({_id: postId}, modifier);
        const updatedPost = context.Posts.findOne(postId)
        runCallbacksAsync('posts.alignment.async', updatedPost, post, context);
        return await accessFilterSingle(context.currentUser, context.Posts, updatedPost, context);
      } else {
        throw new Error(`app.user_cannot_edit_post_alignment_forum_status`);
      }
    }
  }
};

addGraphQLResolvers(alignmentPostResolvers);
addGraphQLMutation('alignmentPost(postId: String, af: Boolean): Post');


// const suggestAlignmentPostResolvers = {
//   Mutation: {
//     suggestAlignmentPost(root, { postId, suggestForAlignmentUserIds }, context: ResolverContext) {
//       const post = context.Posts.findOne(postId)
//
//       if (Users.canDo(context.currentUser, "posts.alignment.new")) {
//         let modifier = { $set: {suggestForAlignmentUserIds: suggestForAlignmentUserIds} };
//         modifier = runCallbacks('posts.suggestAlignment.sync', modifier);
//         context.Posts.update({_id: postId}, modifier);
//         const updatedPost = context.Posts.findOne(postId)
//         runCallbacksAsync('posts.suggestAlignment.async', updatedPost, post, context);
//         return context.Users.restrictViewableFields(context.currentUser, context.Posts, updatedPost);
//       } else {
//         throw new Error({id: `app.user_cannot_sugest_post_alignment_forum_status`});
//       }
//     }
//   }
// };
//
// addGraphQLResolvers(suggestAlignmentPostResolvers);
// addGraphQLMutation('suggestAlignmentPost(postId: String, suggestForAlignmentUserIds: Array): Post');
