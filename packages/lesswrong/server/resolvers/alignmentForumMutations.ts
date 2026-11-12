import { invalidatePostPageCache } from '../postPageCache/invalidatePostPageCache';
import gql from "graphql-tag"
import { userCanDo, userIsAdmin, userIsMemberOf, userOwns } from '../../lib/vulcan-users/permissions';
import { userCanMakeAlignmentPost } from '../../lib/alignment-forum/users/helpers';
import { userIsPostCoauthor } from '../../lib/collections/posts/helpers';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { moveToAFUpdatesUserAFKarma, postsMoveToAFAddsAlignmentVoting } from '../callbacks/alignment-forum/callbacks';
import { updateComment } from '../collections/comments/mutations';
import { updatePost } from '../collections/posts/mutations';
import { backgroundTask } from "../utils/backgroundTask";
import { throwError } from '../vulcan-lib/errors';
import uniq from 'lodash/uniq';
import without from 'lodash/without';

const userCanReviewAlignmentSuggestions = (user: DbUser) => {
  return userIsAdmin(user) || userIsMemberOf(user, 'alignmentForumAdmins');
}

const userCanSetPostAlignmentSuggestion = (user: DbUser, post: DbPost) => {
  return userOwns(user, post)
    || userIsPostCoauthor(user, post)
    || userCanDo(user, 'posts.alignment.suggest')
    || userCanReviewAlignmentSuggestions(user);
}

const userCanSetCommentAlignmentSuggestion = (user: DbUser, comment: DbComment) => {
  return userOwns(user, comment)
    || userCanDo(user, 'comments.alignment.suggest')
    || userCanReviewAlignmentSuggestions(user);
}

const getUserIdsWithSuggestion = (userIds: string[], userId: string, suggested: boolean) => {
  return suggested ? uniq([...userIds, userId]) : without(userIds, userId);
}

function getCurrentUserOrThrow(context: ResolverContext): DbUser {
  if (!context.currentUser) {
    throwError({ id: 'app.operation_not_allowed' });
  }
  return context.currentUser;
}

async function getViewablePostOrThrow(postId: string, context: ResolverContext): Promise<DbPost> {
  const post = await context.Posts.findOne({_id: postId});
  if (!post || !await accessFilterSingle(context.currentUser, 'Posts', post, context)) {
    throwError({ id: 'app.document_not_found' });
  }
  return post;
}

async function getViewableCommentOrThrow(commentId: string, context: ResolverContext): Promise<DbComment> {
  const comment = await context.Comments.findOne({_id: commentId});
  if (!comment || !await accessFilterSingle(context.currentUser, 'Comments', comment, context)) {
    throwError({ id: 'app.document_not_found' });
  }
  return comment;
}

export const alignmentForumMutations = {
  async alignmentComment(root: void, {commentId, af}: {commentId: string, af: boolean}, context: ResolverContext) {
    const currentUser = getCurrentUserOrThrow(context);
    const comment = await getViewableCommentOrThrow(commentId, context);
    if (!userCanDo(currentUser, "comments.alignment.move.all")) {
      throwError({ id: 'app.operation_not_allowed' });
    }

    const updatedComment = await updateComment({
      selector: { _id: comment._id },
      data: {
        af,
        afDate: af ? new Date() : null,
        moveToAlignmentUserId: af ? currentUser._id : null,
      },
    }, context);
    return await accessFilterSingle(currentUser, 'Comments', updatedComment, context);
  },
  async alignmentPost(root: void, {postId, af}: {postId: string, af: boolean}, context: ResolverContext) {
    const post = await context.Posts.findOne(postId)
    if (!post) throw new Error("Invalid post ID");

    if (userCanMakeAlignmentPost(context.currentUser, post)) {
      let modifier = { $set: {af: af} };
      await context.Posts.rawUpdateOne({_id: postId}, modifier);
      const updatedPost = (await context.Posts.findOne(postId))!
      await moveToAFUpdatesUserAFKarma(updatedPost, post);
      backgroundTask(postsMoveToAFAddsAlignmentVoting(updatedPost, post));
      await invalidatePostPageCache(postId);
      return await accessFilterSingle(context.currentUser, 'Posts', updatedPost, context);
    } else {
      throw new Error(`app.user_cannot_edit_post_alignment_forum_status`);
    }
  },
  async setPostSuggestedForAlignment(root: void, {postId, suggested}: {postId: string, suggested: boolean}, context: ResolverContext) {
    const currentUser = getCurrentUserOrThrow(context);
    const post = await getViewablePostOrThrow(postId, context);
    if (!userCanSetPostAlignmentSuggestion(currentUser, post)) {
      throwError({ id: 'app.operation_not_allowed' });
    }

    const updatedPost = await updatePost({
      selector: { _id: post._id },
      data: { suggestForAlignmentUserIds: getUserIdsWithSuggestion(post.suggestForAlignmentUserIds, currentUser._id, suggested) },
    }, context);
    return await accessFilterSingle(currentUser, 'Posts', updatedPost, context);
  },
  async setCommentSuggestedForAlignment(root: void, {commentId, suggested}: {commentId: string, suggested: boolean}, context: ResolverContext) {
    const currentUser = getCurrentUserOrThrow(context);
    const comment = await getViewableCommentOrThrow(commentId, context);
    if (!userCanSetCommentAlignmentSuggestion(currentUser, comment)) {
      throwError({ id: 'app.operation_not_allowed' });
    }

    const updatedComment = await updateComment({
      selector: { _id: comment._id },
      data: { suggestForAlignmentUserIds: getUserIdsWithSuggestion(comment.suggestForAlignmentUserIds, currentUser._id, suggested) },
    }, context);
    return await accessFilterSingle(currentUser, 'Comments', updatedComment, context);
  },
  async reviewPostForAlignment(root: void, {postId, approved}: {postId: string, approved: boolean}, context: ResolverContext) {
    const currentUser = getCurrentUserOrThrow(context);
    const post = await getViewablePostOrThrow(postId, context);
    if (!userCanReviewAlignmentSuggestions(currentUser)) {
      throwError({ id: 'app.operation_not_allowed' });
    }

    const updatedPost = await updatePost({
      selector: { _id: post._id },
      data: {
        reviewForAlignmentUserId: currentUser._id,
        ...(approved && { af: true, afDate: new Date() }),
      },
    }, context);
    return await accessFilterSingle(currentUser, 'Posts', updatedPost, context);
  },
  async reviewCommentForAlignment(root: void, {commentId, approved}: {commentId: string, approved: boolean}, context: ResolverContext) {
    const currentUser = getCurrentUserOrThrow(context);
    const comment = await getViewableCommentOrThrow(commentId, context);
    if (!userCanReviewAlignmentSuggestions(currentUser)) {
      throwError({ id: 'app.operation_not_allowed' });
    }

    const updatedComment = await updateComment({
      selector: { _id: comment._id },
      data: {
        reviewForAlignmentUserId: currentUser._id,
        ...(approved && { af: true, afDate: new Date() }),
      },
    }, context);
    return await accessFilterSingle(currentUser, 'Comments', updatedComment, context);
  },
}

export const alignmentForumTypeDefs = gql`
  extend type Mutation {
    alignmentComment(commentId: String!, af: Boolean!): Comment
    alignmentPost(postId: String, af: Boolean): Post
    setPostSuggestedForAlignment(postId: String!, suggested: Boolean!): Post
    setCommentSuggestedForAlignment(commentId: String!, suggested: Boolean!): Comment
    reviewPostForAlignment(postId: String!, approved: Boolean!): Post
    reviewCommentForAlignment(commentId: String!, approved: Boolean!): Comment
  }
`
