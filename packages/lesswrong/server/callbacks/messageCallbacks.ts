import { SENT_MODERATOR_MESSAGE } from "@/lib/collections/moderatorActions/constants";
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { loadByIds } from '../../lib/loaders';
import type { AfterCreateCallbackProperties } from '../mutationCallbacks';
import { createNotifications } from '../notificationCallbacksHelpers';
import { createModeratorAction } from '../collections/moderatorActions/mutations';
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { updateConversation } from '../collections/conversations/mutations';

export function checkIfNewMessageIsEmpty(message: CreateMessageDataInput) {
  const { data } = (message.contents && message.contents.originalContents) || {}
  if (!data) {
    throw new Error("You cannot send an empty message");
  }
}

export function unArchiveConversations({ document, context }: AfterCreateCallbackProperties<'Messages'>) {
  const { Conversations } = context;

  void Conversations.rawUpdateOne({_id:document.conversationId}, {$set: {archivedByIds: []}});
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
      void createModeratorAction({
        data: {
          userId: nonAdminParticipant._id,
          type: SENT_MODERATOR_MESSAGE,
          endedAt: new Date(),
        },
      }, context);
    }
  }
}

/**
 * If the current user is not part of the conversation then add them to make
 * sure they get notified about future messages (only mods have permission to
 * add themselves to conversations).
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
    !conversation.participantIds.includes(currentUser._id)
  ) {
    await updateConversation({
      data: { participantIds: [...conversation.participantIds, currentUser._id] },
      selector: { _id: conversationId }
    }, createAnonymousContext());
  }
}

export async function updateConversationActivity(message: DbMessage, context: ResolverContext) {
  const { Conversations, Users } = context;

  // Update latest Activity timestamp on conversation when new message is added
  const user = await Users.findOne(message.userId);
  const conversation = await Conversations.findOne(message.conversationId);
  if (!conversation) throw Error(`Can't find conversation for message ${message}`)
    
  const userContext = await computeContextFromUser({ user: user, isSSR: false });
  await updateConversation({ data: {latestActivity: message.createdAt}, selector: { _id: conversation._id } }, userContext);
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
  await createNotifications({userIds: recipientIds, notificationType: 'newMessage', documentType: 'message', documentId: message._id, noEmail: message.noEmail});
}
