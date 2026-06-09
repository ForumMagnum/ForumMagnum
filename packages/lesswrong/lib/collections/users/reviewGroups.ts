import { AUTO_BLOCKED_FROM_SENDING_DMS, FLAGGED_FOR_N_DMS, MANUAL_FLAG_ALERT, MANUAL_NEEDS_REVIEW, MANUAL_RATE_LIMIT_EXPIRED, POTENTIAL_TARGETED_DOWNVOTING, RECEIVED_VOTING_PATTERN_WARNING, reviewTriggerModeratorActions, SNOOZE_EXPIRED, STRICTER_COMMENT_AUTOMOD_RATE_LIMIT, STRICTER_POST_AUTOMOD_RATE_LIMIT, UNREVIEWED_BIO_UPDATE, UNREVIEWED_COMMENT, UNREVIEWED_FIRST_COMMENT, UNREVIEWED_FIRST_POST, UNREVIEWED_MAP_LOCATION_UPDATE, UNREVIEWED_POST, UNREVIEWED_PROFILE_IMAGE_UPDATE } from "@/lib/collections/moderatorActions/constants";
import { maybeDate } from "@/lib/utils/dateUtils";
import { UnionOf } from "@/lib/utils/typeGuardUtils";
import maxBy from "lodash/maxBy";

/**
 * Maps each supermod review group to its priority; a user is assigned to their
 * highest-priority fresh review-trigger group.
 */
export const REVIEW_GROUP_TO_PRIORITY = {
  newContent: 7,
  offboard: 6,
  highContext: 5,
  maybeSpam: 4,
  automod: 3,
  snoozeExpired: 2,
  unknown: 1,
} as const satisfies Record<ReviewGroup, number>;

/**
 * Ensures that we don't forget to add new review-trigger moderator action types
 * as explicitly-handled cases in the `getModeratorActionGroup` and
 * `getPrimaryDisplayedModeratorAction` switch statements
 */
export function typeAssertModeratorActionTypeIsNotReviewTrigger(moderatorActionType: Exclude<ModeratorActionType, UnionOf<typeof reviewTriggerModeratorActions>>) {}

export function getModeratorActionGroup(actionType: ModeratorActionType): ReviewGroup {
  switch (actionType) {
    case UNREVIEWED_FIRST_POST:
    case UNREVIEWED_FIRST_COMMENT:
    case UNREVIEWED_POST:
    case UNREVIEWED_COMMENT:
      return 'newContent';
    case POTENTIAL_TARGETED_DOWNVOTING:
    case RECEIVED_VOTING_PATTERN_WARNING:
    case AUTO_BLOCKED_FROM_SENDING_DMS:
    case FLAGGED_FOR_N_DMS:
    case MANUAL_FLAG_ALERT:
    case MANUAL_NEEDS_REVIEW:
    case MANUAL_RATE_LIMIT_EXPIRED:
      return 'highContext';
    case UNREVIEWED_BIO_UPDATE:
    case UNREVIEWED_MAP_LOCATION_UPDATE:
    case UNREVIEWED_PROFILE_IMAGE_UPDATE:
      return 'maybeSpam';
    case STRICTER_COMMENT_AUTOMOD_RATE_LIMIT:
    case STRICTER_POST_AUTOMOD_RATE_LIMIT:
      return 'automod'
    case SNOOZE_EXPIRED:
      return 'snoozeExpired';
    default:
      typeAssertModeratorActionTypeIsNotReviewTrigger(actionType);
      return 'unknown';
  }
}

interface ReviewTriggerActionInfo {
  type: ModeratorActionType;
  active: boolean;
  createdAt: Date | string;
}

/**
 * "Fresh" actions are active review-trigger moderator actions created after the
 * user was last removed from the review queue; these determine the review group.
 */
export function getFreshReviewTriggerActions<T extends ReviewTriggerActionInfo>(
  moderatorActions: T[],
  lastRemovedFromReviewQueueAt: Date | string | null | undefined,
): T[] {
  const lastRemovedFromReviewQueueAtTs = maybeDate(lastRemovedFromReviewQueueAt)?.getTime() ?? 0;
  return moderatorActions
    .filter(action => action.active && reviewTriggerModeratorActions.has(action.type))
    .filter(action => new Date(action.createdAt).getTime() > lastRemovedFromReviewQueueAtTs);
}

export function getReviewGroupFromActions(
  moderatorActions: ReviewTriggerActionInfo[],
  lastRemovedFromReviewQueueAt: Date | string | null | undefined,
): ReviewGroup {
  const fresh = getFreshReviewTriggerActions(moderatorActions, lastRemovedFromReviewQueueAt);
  const freshModeratorActionGroups = fresh.map(action => getModeratorActionGroup(action.type));
  return maxBy(freshModeratorActionGroups, group => REVIEW_GROUP_TO_PRIORITY[group]) ?? 'unknown';
}
