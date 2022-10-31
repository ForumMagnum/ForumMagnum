import Conversations from '../../lib/collections/conversations/collection'
import { userIsAdmin } from '../../lib/vulcan-users';
import { getCollectionHooks } from '../mutationCallbacks';
import { getSignatureWithNote } from './postCallbacks';

getCollectionHooks("Messages").createAsync.add(function unArchiveConversations({document}) {
  void Conversations.rawUpdateOne({_id:document.conversationId}, {$set: {archivedByIds: []}});
});

/**
 * Adds a note to a user's sunshineNotes when the first message in a mod conversation is sent to them
 */
getCollectionHooks("Messages").createAsync.add(async function updateUserNotesOnModMessage({ document, context }) {
  const { conversationId } = document;
  const conversation = await context.loaders.Conversations.load(conversationId);
  if (conversation.moderator) {
    const [conversationParticipants, conversationMessageCount] = await Promise.all([
      context.loaders.Users.loadMany(conversation.participantIds),
      // No need to fetch more than 2, we only care if this is the first message in the conversation
      context.Messages.find({ conversationId }, { limit: 2 }).count()
    ]);

    const nonAdminParticipant = conversationParticipants.find(user => !userIsAdmin(user));

    if (nonAdminParticipant && conversationMessageCount === 1) {
      const messageAuthorId = document.userId;
      const messageAuthor = await context.loaders.Users.load(messageAuthorId);
      const responsibleAdminName = messageAuthor.displayName;
      const newNote = getSignatureWithNote(responsibleAdminName, ' sent moderator message');
      const oldNotes = nonAdminParticipant.sunshineNotes ?? '';
      const updatedNotes = `${newNote}${oldNotes}`;
  
      void context.Users.rawUpdateOne({ _id: nonAdminParticipant._id }, { $set: { sunshineNotes: updatedNotes } });  
    }
  }
})