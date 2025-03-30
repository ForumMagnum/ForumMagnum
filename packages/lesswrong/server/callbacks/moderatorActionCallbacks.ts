import { isActionActive, MODERATOR_ACTION_TYPES, RECEIVED_SENIOR_DOWNVOTES_ALERT } from '../../lib/collections/moderatorActions/newSchema';
import { appendToSunshineNotes } from '../../lib/collections/users/helpers';
import { loggerConstructor } from '../../lib/utils/logging';
import { AfterCreateCallbackProperties } from '../mutationCallbacks';
import { triggerReview } from './sunshineCallbackUtils';

export async function triggerReviewAfterModeration({ newDocument, currentUser, context }: AfterCreateCallbackProperties<'ModeratorActions'>) {
  const moderatorAction = newDocument;
  const moderatedUserId = newDocument.userId;
  const logger = loggerConstructor('callbacks-moderatoractions');
  logger('ModeratorAction created, triggering review if necessary')
  if (isActionActive(moderatorAction) || moderatorAction.type === RECEIVED_SENIOR_DOWNVOTES_ALERT) {
    logger('isActionActive truthy')
    void triggerReview(moderatedUserId, context);
  }

  // In the case where there isn't a currentUser, that means that the moderator action was created using automod (via callback) rather than being manually applied
  const responsibleAdminName = currentUser?.displayName ?? 'Automod';

  await appendToSunshineNotes({
    moderatedUserId,
    adminName: responsibleAdminName,
    text: ` "${MODERATOR_ACTION_TYPES[moderatorAction.type]}"`,
    context,
  });
}
