import { SENT_MODERATOR_MESSAGE } from '../../lib/collections/moderatorActions/newSchema';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { loadByIds } from '../../lib/loaders';
import { CreateCallbackProperties } from '../mutationCallbacks';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';
import { createNotifications } from '../notificationCallbacksHelpers';

export function checkIfNewMessageIsEmpty(message: Partial<DbInsertion<DbMessage>>) {
  const { data } = (message.contents && message.contents.originalContents) || {}
  if (!data) {
    throw new Error("You cannot send an empty message");
  }
}

export function unArchiveConversations({ document, context }: CreateCallbackProperties<'Messages'>) {
  const { Conversations } = context;

  void Conversations.rawUpdateOne({_id:document.conversationId}, {$set: {archivedByIds: []}});
}

/**
 * Creates a moderator action when the first message in a mod conversation is sent to the user
 * This also adds a note to a user's sunshineNotes
 */
export async function updateUserNotesOnModMessage({ document, currentUser, context }: CreateCallbackProperties<'Messages'>) {
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
      void createMutator({
        collection: context.ModeratorActions,
        context,
        currentUser,
        document: {
          userId: nonAdminParticipant._id,
          type: SENT_MODERATOR_MESSAGE,
          endedAt: new Date()
        }
      });
    }
  }
}

/**
 * If the current user is not part of the conversation then add them to make
 * sure they get notified about future messages (only mods have permission to
 * add themselves to conversations).
 */
export async function addParticipantIfNew({ document, currentUser, context }: CreateCallbackProperties<'Messages'>) {
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
    await updateMutator({
      currentUser,
      collection: Conversations,
      documentId: conversationId,
      set: {
        participantIds: [...conversation.participantIds, currentUser._id],
      },
      validate: false,
    });
  }
}

export async function updateConversationActivity(message: DbMessage, context: ResolverContext) {
  const { Conversations, Users } = context;

  // Update latest Activity timestamp on conversation when new message is added
  const user = await Users.findOne(message.userId);
  const conversation = await Conversations.findOne(message.conversationId);
  if (!conversation) throw Error(`Can't find conversation for message ${message}`)
  await updateMutator({
    collection: Conversations,
    documentId: conversation._id,
    set: {latestActivity: message.createdAt},
    currentUser: user,
    validate: false,
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
  await createNotifications({userIds: recipientIds, notificationType: 'newMessage', documentType: 'message', documentId: message._id, noEmail: message.noEmail});
}
