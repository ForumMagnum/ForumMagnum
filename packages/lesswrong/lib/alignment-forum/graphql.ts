/*

GraphQL config

*/

import { addGraphQLMutation, addGraphQLResolvers, runCallbacks, runCallbacksAsync } from '../vulcan-lib';
import { userCanDo } from '../vulcan-users/permissions';
import { userCanMakeAlignmentPost } from './users/helpers';
import { accessFilterSingle } from '../utils/schemaUtils';

const alignmentCommentResolvers = {
  Mutation: {
    async alignmentComment(root: void, {commentId, af}: {commentId: string, af: boolean}, context: ResolverContext) {
      const comment = context.Comments.findOne(commentId)

      if (userCanDo(context.currentUser, "comments.alignment.move.all")) {
        let modifier = { $set: {af: af} };
        modifier = runCallbacks({
          name: 'comments.alignment.sync',
          iterator: modifier
        });
        context.Comments.update({_id: commentId}, modifier);
        const updatedComment = context.Comments.findOne(commentId)
        runCallbacksAsync({
          name: 'comments.alignment.async',
          properties: [updatedComment, comment, context]
        });
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
    async alignmentPost(root: void, {postId, af}: {postId: string, af: boolean}, context: ResolverContext) {
      const post = context.Posts.findOne(postId)
      if (!post) throw new Error("Invalid post ID");

      if (userCanMakeAlignmentPost(context.currentUser, post)) {
        let modifier = { $set: {af: af} };
        modifier = runCallbacks({
          name: 'posts.alignment.sync',
          iterator: modifier
        });
        context.Posts.update({_id: postId}, modifier);
        const updatedPost = context.Posts.findOne(postId)
        runCallbacksAsync({
          name: 'posts.alignment.async',
          properties: [updatedPost, post, context]
        });
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
//       if (userCanDo(context.currentUser, "posts.alignment.new")) {
//         let modifier = { $set: {suggestForAlignmentUserIds: suggestForAlignmentUserIds} };
//         modifier = runCallbacks('posts.suggestAlignment.sync', modifier);
//         context.Posts.update({_id: postId}, modifier);
//         const updatedPost = context.Posts.findOne(postId)
//         runCallbacksAsync({
//           name: 'posts.suggestAlignment.async',
//           properties: [updatedPost, post, context]
//         });
//         return restrictViewableFields(context.currentUser, context.Posts, updatedPost);
//       } else {
//         throw new Error({id: `app.user_cannot_sugest_post_alignment_forum_status`});
//       }
//     }
//   }
// };
//
// addGraphQLResolvers(suggestAlignmentPostResolvers);
// addGraphQLMutation('suggestAlignmentPost(postId: String, suggestForAlignmentUserIds: Array): Post');
