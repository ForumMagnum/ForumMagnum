import Conversations from '../../lib/collections/conversations/collection'
import { SENT_MODERATOR_MESSAGE } from '../../lib/collections/moderatorActions/schema';
import { userIsAdmin } from '../../lib/vulcan-users';
import { loadByIds } from '../../lib/loaders';
import { getCollectionHooks } from '../mutationCallbacks';
import { createMutator, updateMutator } from '../vulcan-lib';

getCollectionHooks("Messages").createValidate.add(function NewMessageEmptyCheck (validationErrors, {document: message}) {
  const { data } = (message.contents && message.contents.originalContents) || {}
  if (!data) {
    throw new Error("You cannot send an empty message");
  }
});

getCollectionHooks("Messages").createAsync.add(function unArchiveConversations({document}) {
  void Conversations.rawUpdateOne({_id:document.conversationId}, {$set: {archivedByIds: []}});
});

/**
 * Creates a moderator action when the first message in a mod conversation is sent to the user
 * This also adds a note to a user's sunshineNotes
 */
getCollectionHooks("Messages").createAsync.add(async function updateUserNotesOnModMessage({ document, currentUser, context }) {
  const { conversationId } = document;
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
});

/**
 * If the current user is not part of the conversation then add them to make
 * sure they get notified about future messages (only mods have permission to
 * add themselves to conversations).
 */
getCollectionHooks("Messages").createAsync.add(async function addParticipantIfNew({
  document,
  currentUser,
  context,
}) {
  const {conversationId} = document;
  const conversation = await context.loaders.Conversations.load(conversationId);
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
});
