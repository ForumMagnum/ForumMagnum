import { addGraphQLMutation, addGraphQLResolvers } from '../../lib/vulcan-lib/graphql';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { userCanMakeAlignmentPost } from '../../lib/alignment-forum/users/helpers';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { moveToAFUpdatesUserAFKarma, postsMoveToAFAddsAlignmentVoting } from '../callbacks/alignment-forum/callbacks';
import { commentsAlignmentEdit, recalculateAFCommentMetadata } from '../callbacks/commentCallbackFunctions';

const alignmentCommentResolvers = {
  Mutation: {
    async alignmentComment(root: void, {commentId, af}: {commentId: string, af: boolean}, context: ResolverContext) {
      const comment = await context.Comments.findOne(commentId)
      if (!comment) throw new Error("Invalid comment ID");

      if (userCanDo(context.currentUser, "comments.alignment.move.all")) {
        let modifier = { $set: {af: af} };
        await context.Comments.rawUpdateOne({_id: commentId}, modifier);
        const updatedComment = (await context.Comments.findOne(commentId))!
        await moveToAFUpdatesUserAFKarma(updatedComment, comment);
        await recalculateAFCommentMetadata(comment.postId, context);
        await commentsAlignmentEdit(updatedComment, comment, context);
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
      const post = await context.Posts.findOne(postId)
      if (!post) throw new Error("Invalid post ID");

      if (userCanMakeAlignmentPost(context.currentUser, post)) {
        let modifier = { $set: {af: af} };
        await context.Posts.rawUpdateOne({_id: postId}, modifier);
        const updatedPost = (await context.Posts.findOne(postId))!
        await moveToAFUpdatesUserAFKarma(updatedPost, post);
        void postsMoveToAFAddsAlignmentVoting(updatedPost, post);
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
