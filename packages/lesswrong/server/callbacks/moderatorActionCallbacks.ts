import { isActionActive } from '../../lib/collections/moderatorActions/schema';
import { getNewModActionNotes } from '../../lib/collections/users/helpers';
import { loggerConstructor } from '../../lib/utils/logging';
import { getCollectionHooks } from '../mutationCallbacks';
import { triggerReview } from './sunshineCallbackUtils';

getCollectionHooks('ModeratorActions').createAsync.add(async function triggerReviewAfterModeration({ newDocument, currentUser, context }) {
  const moderatorAction = newDocument;
  const logger = loggerConstructor('callbacks-moderatoractions');
  logger('ModeratorAction created, triggering review if necessary')
  if (isActionActive(moderatorAction)) {
    logger('isActionActive truthy')
    void triggerReview(moderatorAction.userId);
  }

  const moderatedUserId = newDocument.userId;
  const moderatedUser = await context.loaders.Users.load(moderatedUserId);
  // In the case where there isn't a currentUser, that means that the moderator action was created using automod (via callback) rather than being manually applied
  const responsibleAdminName = currentUser?.displayName ?? 'Automod';

  const updatedNotes = getNewModActionNotes(responsibleAdminName, newDocument.type, moderatedUser.sunshineNotes)

  void context.Users.rawUpdateOne({ _id: moderatedUserId }, { $set: { sunshineNotes: updatedNotes } });
});
