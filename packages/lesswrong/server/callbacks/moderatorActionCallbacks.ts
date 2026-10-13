import { getModeratorActionNoteText, isActionActive } from "@/lib/collections/moderatorActions/helpers";
import { reviewTriggerModeratorActions } from "@/lib/collections/moderatorActions/constants";
import { appendToSunshineNotes } from '../users/sunshineNotes';
import { loggerConstructor } from '../../lib/utils/logging';
import { AfterCreateCallbackProperties } from '../mutationCallbacks';
import { triggerReview } from './helpers';

export async function triggerReviewAfterModeration({ newDocument, currentUser, context }: AfterCreateCallbackProperties<'ModeratorActions'>) {
  const moderatorAction = newDocument;
  const moderatedUserId = newDocument.userId;
  const logger = loggerConstructor('callbacks-moderatoractions');
  logger('ModeratorAction created, triggering review if necessary')
  if (reviewTriggerModeratorActions.has(moderatorAction.type) && isActionActive(moderatorAction)) {
    logger('isActionActive truthy')
    await triggerReview(moderatedUserId, context);
  }

  // In the case where there isn't a currentUser, that means that the moderator action was created using automod (via callback) rather than being manually applied
  const responsibleAdminName = currentUser?.displayName ?? 'Automod';

  await appendToSunshineNotes({
    moderatedUserId,
    adminName: responsibleAdminName,
    text: getModeratorActionNoteText(moderatorAction.type),
    context,
  });
}
