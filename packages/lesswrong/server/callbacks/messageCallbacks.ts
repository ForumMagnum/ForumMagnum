import Conversations from '../../lib/collections/conversations/collection'
import { SENT_MODERATOR_MESSAGE } from '../../lib/collections/moderatorActions/schema';
import { userIsAdmin } from '../../lib/vulcan-users';
import { loadByIds } from '../../lib/loaders';
import { getCollectionHooks } from '../mutationCallbacks';
import { createMutator } from '../vulcan-lib';

getCollectionHooks("Messages").newValidate.add(function NewMessageEmptyCheck (message: DbMessage) {
  const { data } = (message.contents && message.contents.originalContents) || {}
  if (!data) {
    throw new Error("You cannot send an empty message");
  }
  return message;
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
