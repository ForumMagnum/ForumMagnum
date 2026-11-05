import moment from "moment";
import difference from "lodash/difference";
import groupBy from "lodash/groupBy";
import intersection from "lodash/intersection";
import uniq from "lodash/uniq";
import { commentIsNotPublicForAnyReason } from "@/lib/collections/comments/helpers";
import { subscriptionTypes } from "@/lib/collections/subscriptions/helpers";
import {
  CommentNotificationFacts,
  evaluateCommentNotificationFilter,
  parseStoredCommentNotificationFilter,
} from "@/lib/collections/users/commentNotificationFilter";
import { filterWhereFieldsNotNull } from "@/lib/utils/typeGuardUtils";
import type { VoteDocTuple } from "@/lib/voting/vote";
import { commentAncestorsToNotifySetting } from "./databaseSettings";
import { createNotifications, getSubscribedUsers } from "./notificationCallbacksHelpers";

/**
 * How long after a comment is posted its votes can make it pass someone's
 * filter. The settings page estimates over the same period, so that it counts
 * the comments that could have notified them.
 */
const FILTER_WINDOW_DAYS = 7;

interface ParentComment {
  commentId: string;
  userId: string;
}

export const getPostAuthorIds = (post: DbPost | null): string[] =>
  post ? [post.userId, ...post.coauthorUserIds] : [];

export async function getParentCommentsToNotify(comment: DbComment, context: ResolverContext): Promise<ParentComment[]> {
  if (!comment.parentCommentId) return [];
  return context.repos.comments.getParentCommentIds({
    commentIds: [comment._id],
    limit: commentAncestorsToNotifySetting.get(context),
  });
}

export async function getCommentReplyRecipients(comment: DbComment, parentComments: ParentComment[]) {
  let newReplyUserIds: string[] = [];
  let newReplyToYouDirectUserIds: string[] = [];
  let newReplyToYouIndirectUserIds: string[] = [];

  for (const {commentId: currentParentCommentId, userId: currentParentCommentAuthorId} of parentComments) {
    const subscribedUsers = await getSubscribedUsers({
      documentId: currentParentCommentId,
      collectionName: "Comments",
      type: subscriptionTypes.newReplies,
      potentiallyDefaultSubscribedUserIds: [currentParentCommentAuthorId],
      userIsDefaultSubscribed: u => u.auto_subscribe_to_my_comments
    })
    const subscribedUserIds = subscribedUsers.map(u=>u._id);

    // Don't notify the author of their own comment, and filter out the author
    // of the parent-comment to be treated specially (with a newReplyToYou
    // notification instead of a newReply notification).
    newReplyUserIds = [...newReplyUserIds, ...difference(subscribedUserIds, [comment.userId, currentParentCommentAuthorId])]

    // Separately notify authors of replies to their own comments
    if (subscribedUserIds.includes(currentParentCommentAuthorId) && currentParentCommentAuthorId !== comment.userId) {
      if (currentParentCommentId === comment.parentCommentId) {
        newReplyToYouDirectUserIds = [...newReplyToYouDirectUserIds, currentParentCommentAuthorId]
      } else {
        newReplyToYouIndirectUserIds = [...newReplyToYouIndirectUserIds, currentParentCommentAuthorId]
      }
    }
  }

  // Take the difference to prevent double-notifying
  newReplyUserIds = uniq(difference(newReplyUserIds, [...newReplyToYouDirectUserIds, ...newReplyToYouIndirectUserIds]));
  newReplyToYouIndirectUserIds = uniq(difference(newReplyToYouIndirectUserIds, newReplyToYouDirectUserIds)); // Direct replies take precedence over indirect replies
  newReplyToYouDirectUserIds = uniq(newReplyToYouDirectUserIds);

  return { newReplyUserIds, newReplyToYouDirectUserIds, newReplyToYouIndirectUserIds };
}

export async function getPostCommentSubscribers(comment: DbComment, post: DbPost | null) {
  return getSubscribedUsers({
    documentId: comment.postId,
    collectionName: "Posts",
    type: subscriptionTypes.newComments,
    potentiallyDefaultSubscribedUserIds: getPostAuthorIds(post),
    userIsDefaultSubscribed: u => u.auto_subscribe_to_my_posts
  });
}

function getCommentNotificationFacts({ comment, userId, postAuthorIds, parentComments, commenterKarma, followedAuthorIds }: {
  comment: Pick<DbComment, "baseScore" | "userId" | "parentCommentId">,
  userId: string,
  postAuthorIds: string[],
  parentComments: ParentComment[],
  commenterKarma: number,
  followedAuthorIds: string[],
}): CommentNotificationFacts {
  const isOnMyPost = postAuthorIds.includes(userId);
  return {
    commentKarma: comment.baseScore,
    commenterKarma,
    commenterIsFollowed: followedAuthorIds.includes(comment.userId),
    topLevelOnMyPost: isOnMyPost && !comment.parentCommentId,
    downthreadOnMyPost: isOnMyPost && !!comment.parentCommentId,
    replyToMyComment: parentComments.some(parent => parent.commentId === comment.parentCommentId && parent.userId === userId),
  };
}

/**
 * Users who wrote the post or a parent comment and have no filter set aren't in
 * either list.
 */
export async function getCommentNotificationFilterResults({ comment, post, parentComments, context }: {
  comment: DbComment,
  post: DbPost | null,
  parentComments: ParentComment[],
  context: ResolverContext,
}): Promise<{ passingUserIds: string[], withheldUserIds: string[] }> {
  const { Users, loaders, repos } = context;
  const postAuthorIds = getPostAuthorIds(post);
  const candidateUserIds = difference(uniq([...postAuthorIds, ...parentComments.map(p => p.userId)]), [comment.userId]);
  if (candidateUserIds.length === 0) return { passingUserIds: [], withheldUserIds: [] };

  const candidates = await Users.find(
    { _id: { $in: candidateUserIds }, commentNotificationFilter: { $ne: null } },
    {},
    { commentNotificationFilter: 1 },
  ).fetch();
  const usersWithFilters = filterWhereFieldsNotNull(candidates, "commentNotificationFilter");
  if (usersWithFilters.length === 0) return { passingUserIds: [], withheldUserIds: [] };

  const commenter = await loaders.Users.load(comment.userId);
  if (!commenter) throw new Error(`Could not find user: ${comment.userId}`);

  const results = await Promise.all(usersWithFilters.map(async user => {
    const facts = getCommentNotificationFacts({
      comment,
      userId: user._id,
      postAuthorIds,
      parentComments,
      commenterKarma: commenter.karma,
      followedAuthorIds: await repos.users.getFollowedAuthorIds(user._id),
    });
    const expression = parseStoredCommentNotificationFilter(user.commentNotificationFilter);
    return { userId: user._id, passes: evaluateCommentNotificationFilter(expression, facts) };
  }));

  return {
    passingUserIds: results.filter(r => r.passes).map(r => r.userId),
    withheldUserIds: results.filter(r => !r.passes).map(r => r.userId),
  };
}

/**
 * A new comment's karma is just its author's self-vote, so filters on karma
 * can't be decided when the comment is posted. Votes during the filter window
 * re-check the filters of anyone who hasn't yet been told about the comment.
 */
export async function notifyUsersWhenVoteMakesCommentPassFilter({ newDocument, vote }: VoteDocTuple, context: ResolverContext): Promise<void> {
  if (vote.collectionName !== "Comments") return;

  // Comment creation casts a self-vote while sendNewCommentNotifications is
  // running, so handling self-votes here would race it and double-notify.
  if (vote.userId === newDocument.userId) return;

  const { Comments, Notifications, loaders } = context;
  const comment = await Comments.findOne({ _id: vote.documentId });
  if (!comment) throw new Error(`Could not find comment: ${vote.documentId}`);

  const isInFilterWindow = moment(comment.postedAt).isAfter(moment().subtract(FILTER_WINDOW_DAYS, "days"));
  const isUnpublishedModelReply = !!comment.llmRunId && !comment.llmReplyPublishedAt;
  if (!isInFilterWindow || isUnpublishedModelReply || commentIsNotPublicForAnyReason(comment, context.forumType)) return;

  const post = comment.postId ? await loaders.Posts.load(comment.postId) : null;
  const parentComments = await getParentCommentsToNotify(comment, context);
  const { passingUserIds } = await getCommentNotificationFilterResults({ comment, post, parentComments, context });
  if (passingUserIds.length === 0) return;

  const existingNotifications = await Notifications.find(
    { documentId: comment._id, documentType: "comment", userId: { $in: passingUserIds } },
    {},
    { userId: 1 },
  ).fetch();
  const usersToNotify = difference(passingUserIds, existingNotifications.map(n => n.userId));
  if (usersToNotify.length === 0) return;

  const replyRecipients = await getCommentReplyRecipients(comment, parentComments);
  const directReplyUserIds = intersection(replyRecipients.newReplyToYouDirectUserIds, usersToNotify);
  const indirectReplyUserIds = intersection(replyRecipients.newReplyToYouIndirectUserIds, usersToNotify);
  const postSubscriberIds = (await getPostCommentSubscribers(comment, post)).map(u => u._id);
  const postAuthorUserIds = difference(
    intersection(postSubscriberIds, getPostAuthorIds(post), usersToNotify),
    [...directReplyUserIds, ...indirectReplyUserIds],
  );

  const commentNotification = { context, documentType: "comment", documentId: comment._id } as const;
  await Promise.all([
    createNotifications({ ...commentNotification, userIds: directReplyUserIds, notificationType: "newReplyToYou", extraData: { direct: true } }),
    createNotifications({ ...commentNotification, userIds: indirectReplyUserIds, notificationType: "newReplyToYou", extraData: { direct: false } }),
    createNotifications({ ...commentNotification, userIds: postAuthorUserIds, notificationType: "newComment" }),
  ]);
}

/**
 * The facts about each recent reply to a user's posts and comments, for the
 * settings page to evaluate candidate filters against. Karma and follows are as
 * they are now, so this approximates what the user would have received.
 */
export async function getCommentNotificationFilterHistory(userId: string, context: ResolverContext): Promise<CommentNotificationFacts[]> {
  const { repos } = context;
  const since = moment().subtract(FILTER_WINDOW_DAYS, "days").toDate();
  const [comments, followedAuthorIds] = await Promise.all([
    repos.comments.getCommentsInUsersDiscussionsSince({ userId, since }),
    repos.users.getFollowedAuthorIds(userId),
  ]);

  const replyCommentIds = comments.filter(c => !!c.parentCommentId).map(c => c._id);
  const parentComments = replyCommentIds.length > 0
    ? await repos.comments.getParentCommentIds({ commentIds: replyCommentIds, limit: commentAncestorsToNotifySetting.get(context) })
    : [];
  const parentCommentsByReplyId = groupBy(parentComments, p => p.replyCommentId);

  return comments
    .filter(comment => (
      comment.postAuthorIds.includes(userId)
      || parentCommentsByReplyId[comment._id]?.some(parent => parent.userId === userId)
    ))
    .map(comment => getCommentNotificationFacts({
      comment,
      userId,
      postAuthorIds: comment.postAuthorIds,
      parentComments: parentCommentsByReplyId[comment._id] ?? [],
      commenterKarma: comment.commenterKarma,
      followedAuthorIds,
    }));
}
