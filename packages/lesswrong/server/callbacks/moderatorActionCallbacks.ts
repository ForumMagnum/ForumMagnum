import { isActionActive, MODERATOR_ACTION_TYPES, RECEIVED_SENIOR_DOWNVOTES_ALERT } from '../../lib/collections/moderatorActions/schema';
import { appendToSunshineNotes } from '../../lib/collections/users/helpers';
import { loggerConstructor } from '../../lib/utils/logging';
import { getCollectionHooks } from '../mutationCallbacks';
import { triggerReview } from './sunshineCallbackUtils';

getCollectionHooks('ModeratorActions').createAsync.add(async function triggerReviewAfterModeration({ newDocument, currentUser, context }) {
  const moderatorAction = newDocument;
  const logger = loggerConstructor('callbacks-moderatoractions');
  logger('ModeratorAction created, triggering review if necessary')
  if (isActionActive(moderatorAction) || moderatorAction.type === RECEIVED_SENIOR_DOWNVOTES_ALERT) {
    logger('isActionActive truthy')
    void triggerReview(moderatorAction.userId);
  }

  const moderatedUserId = newDocument.userId;
  // In the case where there isn't a currentUser, that means that the moderator action was created using automod (via callback) rather than being manually applied
  const responsibleAdminName = currentUser?.displayName ?? 'Automod';

  await appendToSunshineNotes({
    moderatedUserId,
    adminName: responsibleAdminName,
    text: ` "${MODERATOR_ACTION_TYPES[moderatorAction.type]}"`,
    context,
  });
});
