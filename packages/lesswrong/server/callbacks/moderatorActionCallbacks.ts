import { isActionActive, MODERATOR_ACTION_TYPES } from '../../lib/collections/moderatorActions/schema';
import { getSignatureWithNote } from '../../lib/collections/users/helpers';
import { getCollectionHooks } from '../mutationCallbacks';
import { triggerReviewIfNeeded } from './sunshineCallbackUtils';

getCollectionHooks('ModeratorActions').createAfter.add(async function triggerReview(doc) {
  if (isActionActive(doc)) {
    void triggerReviewIfNeeded(doc.userId, true);
  }
  return doc;
});

getCollectionHooks('ModeratorActions').createAsync.add(async function updateNotes({ newDocument, currentUser, context }) {
  const moderatedUserId = newDocument.userId;
  const moderatedUser = await context.loaders.Users.load(moderatedUserId);
  const responsibleAdminName = currentUser?.displayName ?? 'probably automod';
  const modActionDescription = MODERATOR_ACTION_TYPES[newDocument.type];
  const newNote = getSignatureWithNote(responsibleAdminName, ` applied mod action "${modActionDescription}"`);
  const oldNotes = moderatedUser.sunshineNotes ?? '';
  const updatedNotes = `${newNote}${oldNotes}`;

  void context.Users.rawUpdateOne({ _id: moderatedUserId }, { $set: { sunshineNotes: updatedNotes } });
});
