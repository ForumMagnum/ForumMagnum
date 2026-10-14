import { createHash } from 'crypto';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { getPendingContentSelector } from '@/lib/collections/users/reviewGroups';
import { validateUserRateLimit } from '@/lib/collections/userRateLimits/helpers';
import { VOTING_DISABLED } from '@/lib/collections/moderatorActions/constants';
import { isActionActive } from '@/lib/collections/moderatorActions/helpers';
import { MODERATION_TEMPLATE_USED_EVENT } from '@/lib/collections/moderationTemplates/constants';
import { updatePost } from '../collections/posts/mutations';
import { updateComment } from '../collections/comments/mutations';
import { updateUser } from '../collections/users/mutations';
import { createMessage } from '../collections/messages/mutations';
import { createConversation } from '../collections/conversations/mutations';
import { createUserRateLimit } from '../collections/userRateLimits/mutations';
import { createModeratorAction } from '../collections/moderatorActions/mutations';
import { createLWEvent } from '../collections/lwevents/mutations';
import { appendToSunshineNotes } from '../users/sunshineNotes';
import { checkIfNewMessageIsEmpty } from '../callbacks/messageCallbacks';

const REJECTED_ALONGSIDE_REASON = '<p>This content was rejected alongside another submission. Please see the rejection message for that submission for the explanation.</p>';
const SEE_MODERATOR_MESSAGE_REASON = '<p>Look for a separate message from a moderator explaining why your content was rejected.</p>';

interface ContentRejection {
  documentId: string;
  collectionName: 'Posts' | 'Comments';
  reason: string;
  templateIds?: string[] | null;
}

interface ModerationMessage {
  conversationId?: string | null;
  contents: CreateRevisionDataInput;
  noEmail?: boolean | null;
}

export interface UserModerationOptions {
  operationId: string;
  userId: string;
  rejection?: ContentRejection | null;
  message?: ModerationMessage | null;
  disablePermissions: boolean;
  rateLimits: CreateUserRateLimitDataInput[];
  rejectAll: boolean;
  removeFromQueue: boolean;
}

/** Stable IDs make retries of a partially completed operation reuse its creations. */
function moderationDocumentId(options: UserModerationOptions, moderatorId: string, kind: string) {
  return createHash('sha256').update(`${moderatorId}:${options.userId}:${options.operationId}:${kind}`).digest('hex').slice(0, 27);
}

/**
 * Shared by the sidebar and the supported reject-and-remove action. All validation
 * precedes writes, all pending content is fetched on the server, and queue removal
 * is last. Mutations retain their normal callbacks; this is not a transaction over
 * email or other external effects.
 */
export async function completeUserModeration(options: UserModerationOptions, context: ResolverContext) {
  const { currentUser, Users, Posts, Comments, Conversations, Messages, UserRateLimits, ModeratorActions, ModerationTemplates, LWEvents } = context;
  if (!currentUser || !userIsAdminOrMod(currentUser)) throw new Error('Only moderators can perform moderation actions');
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(options.operationId)) throw new Error('Invalid moderation operation ID');
  const user = await Users.findOne(options.userId);
  if (!user) throw new Error('Invalid user ID');
  if (!options.rejection && !options.message) throw new Error('A rejection or moderator message is required');
  if (options.rateLimits.length > 2 || new Set(options.rateLimits.map(limit => limit.type)).size !== options.rateLimits.length) {
    throw new Error('Specify at most one post limit and one comment limit');
  }
  for (const limit of options.rateLimits) {
    if (limit.userId !== user._id) throw new Error('The rate limit must belong to the moderated user');
    validateUserRateLimit(limit);
  }

  const focusedPost = options.rejection?.collectionName === 'Posts' ? await Posts.findOne(options.rejection.documentId) : null;
  const focusedComment = options.rejection?.collectionName === 'Comments' ? await Comments.findOne(options.rejection.documentId) : null;
  if (options.rejection) {
    const content = focusedPost ?? focusedComment;
    if (!content || content.userId !== user._id) throw new Error('The rejected content must belong to the moderated user');
    if (!options.rejection.reason.trim()) throw new Error('A rejection reason is required');
  }
  const templateIds = [...new Set(options.rejection?.templateIds ?? [])];
  if (templateIds.length) {
    const templates = await ModerationTemplates.find({ _id: { $in: templateIds }, collectionName: 'Rejections' }).fetch();
    if (templates.length !== templateIds.length) throw new Error('Invalid rejection template');
  }
  if (options.message) {
    checkIfNewMessageIsEmpty(options.message);
    if (options.message.conversationId) {
      const conversation = await Conversations.findOne(options.message.conversationId);
      if (!conversation?.moderator || !conversation.participantIds.includes(user._id)) {
        throw new Error('Select a moderator conversation with the moderated user');
      }
    }
  }

  const [pendingPosts, pendingComments] = options.rejectAll
    ? await Promise.all([
      Posts.find({ userId: user._id, ...getPendingContentSelector('Posts') }).fetch(),
      Comments.find({ userId: user._id, ...getPendingContentSelector('Comments') }).fetch(),
    ])
    : [[], []];
  const posts = focusedPost ? [focusedPost, ...pendingPosts.filter(post => post._id !== focusedPost._id)] : pendingPosts;
  const comments = focusedComment ? [focusedComment, ...pendingComments.filter(comment => comment._id !== focusedComment._id)] : pendingComments;

  let message: DbMessage | null = null;
  if (options.message) {
    const conversationId = options.message.conversationId ?? moderationDocumentId(options, currentUser._id, 'conversation');
    if (!options.message.conversationId && !await Conversations.findOne(conversationId)) {
      const data = { _id: conversationId, participantIds: [user._id, currentUser._id], title: 'Content rejected and permissions restricted', moderator: true };
      await createConversation({ data }, context);
    }
    const messageData = { ...options.message, conversationId, userId: currentUser._id, _id: moderationDocumentId(options, currentUser._id, 'message') };
    message = await Messages.findOne(messageData._id) ?? await createMessage({ data: messageData }, context);
  }

  const otherReason = options.message ? SEE_MODERATOR_MESSAGE_REASON : REJECTED_ALONGSIDE_REASON;
  const rejectedPosts: DbPost[] = [];
  for (const post of posts) {
    rejectedPosts.push(post.rejected ? post : await updatePost({
      selector: { _id: post._id },
      data: { rejected: true, rejectedReason: post._id === focusedPost?._id ? options.rejection?.reason : otherReason },
    }, context));
  }
  const rejectedComments: DbComment[] = [];
  for (const comment of comments) {
    rejectedComments.push(comment.rejected ? comment : await updateComment({
      selector: { _id: comment._id },
      data: { rejected: true, rejectedReason: comment._id === focusedComment?._id ? options.rejection?.reason : otherReason },
    }, context));
  }

  for (const templateId of templateIds) {
    const eventData = {
      _id: moderationDocumentId(options, currentUser._id, `template:${templateId}`),
      name: MODERATION_TEMPLATE_USED_EVENT,
      documentId: templateId,
      properties: { contentId: options.rejection?.documentId, contentCollectionName: options.rejection?.collectionName },
      intercom: false,
    };
    if (!await LWEvents.findOne(eventData._id)) await createLWEvent({ data: eventData }, context);
  }
  for (const limit of options.rateLimits) {
    const limitData = { ...limit, _id: moderationDocumentId(options, currentUser._id, `rateLimit:${limit.type}`) };
    if (!await UserRateLimits.findOne(limitData._id)) await createUserRateLimit({ data: limitData }, context);
  }
  if (options.disablePermissions) {
    const votingActions = await ModeratorActions.find({ userId: user._id, type: VOTING_DISABLED }).fetch();
    if (!votingActions.some(isActionActive)) {
      const actionData: CreateModeratorActionDataInput & { _id: string } = { _id: moderationDocumentId(options, currentUser._id, 'disableVoting'), userId: user._id, type: VOTING_DISABLED, endedAt: null };
      if (!await ModeratorActions.findOne(actionData._id)) await createModeratorAction({ data: actionData }, context);
    }
    if (!user.postingDisabled || !user.allCommentingDisabled || !user.conversationsDisabled) {
      await updateUser({ selector: { _id: user._id }, data: { postingDisabled: true, allCommentingDisabled: true, conversationsDisabled: true } }, context);
      await appendToSunshineNotes({ moderatedUserId: user._id, adminName: currentUser.displayName, text: 'all permissions disabled', context });
    }
  }
  if (options.removeFromQueue && user.needsReview) {
    await appendToSunshineNotes({ moderatedUserId: user._id, adminName: currentUser.displayName, text: 'removed from review queue (content rejected)', context });
    await updateUser({ selector: { _id: user._id }, data: { needsReview: false, reviewedByUserId: null, reviewedAt: user.reviewedAt ? new Date() : null } }, context);
  }
  const updatedUser = await Users.findOne(user._id);
  if (!updatedUser) throw new Error('Moderated user no longer exists');
  return { user: updatedUser, rejectedPosts, rejectedComments, message };
}
