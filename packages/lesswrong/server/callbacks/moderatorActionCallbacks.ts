import { isActionActive } from '../../lib/collections/moderatorActions/schema';
import { getNewModActionNotes } from '../../lib/collections/users/helpers';
import { loggerConstructor } from '../../lib/utils/logging';
import { getCollectionHooks } from '../mutationCallbacks';
import { triggerReview } from './sunshineCallbackUtils';

getCollectionHooks('ModeratorActions').createAfter.add(async function triggerReviewAfterModeration(doc) {
  const logger = loggerConstructor('callbacks-moderatoractions');
  logger('ModeratorAction created, triggering review if necessary')
  if (isActionActive(doc)) {
    logger('isActionActive truthy')
    void triggerReview(doc.userId);
  }
  return doc;
});

getCollectionHooks('ModeratorActions').createAsync.add(async function updateNotes({ newDocument, currentUser, context }) {
  const moderatedUserId = newDocument.userId;
  const moderatedUser = await context.loaders.Users.load(moderatedUserId);
  // In the case where there isn't a currentUser, that means that the moderator action was created using automod (via callback) rather than being manually applied
  const responsibleAdminName = currentUser?.displayName ?? 'Automod';

  const updatedNotes = getNewModActionNotes(responsibleAdminName, newDocument.type, moderatedUser.sunshineNotes)

  void context.Users.rawUpdateOne({ _id: moderatedUserId }, { $set: { sunshineNotes: updatedNotes } });
});
