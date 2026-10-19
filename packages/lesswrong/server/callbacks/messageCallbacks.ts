import { SENT_MODERATOR_MESSAGE } from "@/lib/collections/moderatorActions/constants";
import { userIsAdmin, userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { loadByIds } from '../../lib/loaders';
import type { AfterCreateCallbackProperties } from '../mutationCallbacks';
import { createNotifications } from '../notificationCallbacksHelpers';
import { createModeratorAction } from '../collections/moderatorActions/mutations';
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { updateConversation } from '../collections/conversations/mutations';
import { backgroundTask } from "../utils/backgroundTask";
import { isTeamInboxConversation } from "../utils/teamInbox";
import { getAdminTeamAccountId } from "../utils/adminTeamAccount";

export function checkIfNewMessageIsEmpty(message: Pick<CreateMessageDataInput, 'contents'>) {
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
    
  // In moderator conversations, a message from the user puts the conversation in the
  // moderator inbox and a moderator's reply marks it done. Messages from the team
  // account itself (e.g. the automated appeal-link reply) leave the flag alone, so
  // the user's message stays in the queue.
  const teamInboxFields = conversation.moderator && message.userId !== await getAdminTeamAccountId(context)
    ? { awaitingModeratorReply: !userIsAdminOrMod(user) }
    : {};

  const userContext = await computeContextFromUser({ user: user, isSSR: false, forumType: context.forumType });
  await updateConversation({ data: {latestActivity: message.createdAt, ...teamInboxFields}, selector: { _id: conversation._id } }, userContext);
}

/**
 * Moderators handle moderator conversations through the moderation inbox, so
 * they aren't notified about new messages in them.
 */
async function getNonModeratorUserIds(userIds: string[], context: ResolverContext): Promise<string[]> {
  const users = await loadByIds(context, "Users", userIds);
  return users.flatMap(user => (user && !userIsAdminOrMod(user)) ? [user._id] : []);
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
  const otherParticipantIds = conversation.participantIds.filter((id) => (id !== message.userId));
  const recipientIds = conversation.moderator
    ? await getNonModeratorUserIds(otherParticipantIds, context)
    : otherParticipantIds;

  // Create notification
  await createNotifications({ context, userIds: recipientIds, notificationType: 'newMessage', documentType: 'message', documentId: message._id, noEmail: message.noEmail});
}
