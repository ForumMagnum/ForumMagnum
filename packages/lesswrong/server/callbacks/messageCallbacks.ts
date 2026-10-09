import { SENT_MODERATOR_MESSAGE } from "@/lib/collections/moderatorActions/constants";
import { userIsAdmin, userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { loadByIds } from '../../lib/loaders';
import type { AfterCreateCallbackProperties } from '../mutationCallbacks';
import { createNotifications } from '../notificationCallbacksHelpers';
import { createModeratorAction } from '../collections/moderatorActions/mutations';
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { updateConversation } from '../collections/conversations/mutations';
import { backgroundTask } from "../utils/backgroundTask";
import { isTeamInboxConversation, sendMessageAs } from "../utils/teamInbox";
import { getAdminTeamAccount, getAdminTeamAccountId } from "../utils/adminTeamAccount";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";

export function checkIfNewMessageIsEmpty(message: CreateMessageDataInput) {
  const { data } = (message.contents && message.contents.originalContents) || {}
  if (!data) {
    throw new Error("You cannot send an empty message");
  }
}

export function unArchiveConversations({ document, context }: AfterCreateCallbackProperties<'Messages'>) {
  const { Conversations } = context;

  backgroundTask(Conversations.rawUpdateOne({_id:document.conversationId}, {$set: {archivedByIds: []}}));
}

/**
 * Creates a moderator action when the first message in a mod conversation is sent to the user
 * This also adds a note to a user's sunshineNotes
 */
export async function updateUserNotesOnModMessage({ document, context }: AfterCreateCallbackProperties<'Messages'>) {
  const { conversationId } = document;
  // In practice this should never happen, we just don't have types set up for handling required fields
  if (!conversationId) {
    return;
  }

  const conversation = await context.loaders.Conversations.load(conversationId);
  if (conversation.moderator) {
    const [conversationParticipants, conversationMessageCount] = await Promise.all([
      loadByIds(context, "Users", conversation.participantIds),
      // No need to fetch more than 2, we only care if this is the first message in the conversation
      context.Messages.find({ conversationId }, { limit: 2 }).count()
    ]);

    const nonAdminParticipant = conversationParticipants.find(user => !userIsAdmin(user));

    if (nonAdminParticipant && conversationMessageCount === 1) {
      backgroundTask(createModeratorAction({
        data: {
          userId: nonAdminParticipant._id,
          type: SENT_MODERATOR_MESSAGE,
          endedAt: new Date(),
        },
      }, context));
    }
  }
}

/**
 * If the current user is not part of the conversation then add them to make
 * sure they get notified about future messages (only mods have permission to
 * add themselves to conversations). Team inbox conversations are the exception,
 * since they're meant to stay out of individual moderators' inboxes.
 */
export async function addParticipantIfNew({ document, currentUser, context }: AfterCreateCallbackProperties<'Messages'>) {
  const { Conversations, loaders } = context;

  const { conversationId } = document;
  if (!conversationId) {
    return;
  }

  const conversation = await loaders.Conversations.load(conversationId);
  if (
    currentUser &&
    conversation &&
    !conversation.participantIds.includes(currentUser._id) &&
    !await isTeamInboxConversation(conversation, context)
  ) {
    await updateConversation({
      data: { participantIds: [...conversation.participantIds, currentUser._id] },
      selector: { _id: conversationId }
    }, context);
  }
}

export async function updateConversationActivity(message: DbMessage, context: ResolverContext) {
  const { Conversations, Users } = context;

  // Update latest Activity timestamp on conversation when new message is added
  const user = await Users.findOne(message.userId);
  const conversation = await Conversations.findOne(message.conversationId);
  if (!conversation) throw Error(`Can't find conversation for message ${message}`)
    
  // Messages from the team account itself (e.g. the automated appeal-link
  // reply) leave the flag alone, so the user's message stays in the queue.
  const teamInboxFields = await isTeamInboxConversation(conversation, context) && message.userId !== await getAdminTeamAccountId(context)
    ? { awaitingModeratorReply: !userIsAdminOrMod(user) }
    : {};

  const userContext = await computeContextFromUser({ user: user, isSSR: false, forumType: context.forumType });
  await updateConversation({ data: {latestActivity: message.createdAt, ...teamInboxFields}, selector: { _id: conversation._id } }, userContext);
}

function getAppealLinkReplyHtml(appealUrl: string) {
  return `<p>Thanks for your message. If you'd like us to take a second look at this rejection, please use our <a href="${appealUrl}">rejection review form</a>. We aim to complete reviews within 72 hours. If you have a question about a separate matter, please use Intercom (bottom right button on LessWrong pages) or email team@lesswrong.com</p>`;
}

async function getUnappealedRejectedContent(conversationId: string, userId: string, context: ResolverContext) {
  const { Posts, Comments, RejectionAppeals } = context;
  const selector = { userId, rejected: true, rejectionConversationId: conversationId };
  const post = await Posts.findOne(selector, undefined, { _id: 1 });
  const comment = post ? null : await Comments.findOne(selector, undefined, { _id: 1 });
  const target = post ? { postId: post._id } : comment ? { commentId: comment._id } : null;
  if (!target || await RejectionAppeals.findOne(target)) {
    return null;
  }
  return target;
}

/**
 * When a user first replies to a rejection message, reply from the team
 * account with a link to the appeal page for the rejected content.
 */
export async function sendAppealLinkReplyIfFirstReply(message: DbMessage, context: ResolverContext) {
  const { Conversations, Messages, loaders } = context;
  const conversation = await Conversations.findOne(message.conversationId);
  if (!conversation || !await isTeamInboxConversation(conversation, context)) return;

  const sender = await loaders.Users.load(message.userId);
  if (userIsAdminOrMod(sender) || message.userId === await getAdminTeamAccountId(context)) return;

  const senderMessageCount = await Messages.find({ conversationId: conversation._id, userId: message.userId }).count();
  if (senderMessageCount > 1) return;

  const target = await getUnappealedRejectedContent(conversation._id, message.userId, context);
  const teamAccount = await getAdminTeamAccount(context);
  if (!target || !teamAccount) return;

  const appealPath = 'postId' in target ? `/rejection-review?postId=${target.postId}` : `/rejection-review?commentId=${target.commentId}`;
  await sendMessageAs({
    author: teamAccount,
    conversationId: conversation._id,
    html: getAppealLinkReplyHtml(makeAbsolute(appealPath, context)),
    noEmail: false,
    context,
  });
}

export async function sendMessageNotifications(message: DbMessage, context: ResolverContext) {
  const { Conversations } = context;

  const conversationId = message.conversationId;
  const conversation = await Conversations.findOne(conversationId);
  if (!conversation) throw Error(`Can't find conversation for message: ${message}`)
  
  // For on-site notifications, notify everyone except the sender of the
  // message. For email notifications, notify everyone including the sender
  // (since if there's a back-and-forth in the grouped notifications, you want
  // to see your own messages.)
  const recipientIds = conversation.participantIds.filter((id) => (id !== message.userId));

  // Create notification
  await createNotifications({ context, userIds: recipientIds, notificationType: 'newMessage', documentType: 'message', documentId: message._id, noEmail: message.noEmail});
}
