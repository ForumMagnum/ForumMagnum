import { AUTO_BLOCKED_FROM_SENDING_DMS, FLAGGED_FOR_N_DMS, MANUAL_FLAG_ALERT, MANUAL_NEEDS_REVIEW, MANUAL_RATE_LIMIT_EXPIRED, POTENTIAL_TARGETED_DOWNVOTING, RECEIVED_SENIOR_DOWNVOTES_ALERT, RECEIVED_VOTING_PATTERN_WARNING, STRICTER_COMMENT_AUTOMOD_RATE_LIMIT, STRICTER_POST_AUTOMOD_RATE_LIMIT, UNREVIEWED_BIO_UPDATE, UNREVIEWED_FIRST_COMMENT, UNREVIEWED_FIRST_POST, UNREVIEWED_MAP_LOCATION_UPDATE, UNREVIEWED_PROFILE_IMAGE_UPDATE } from "@/lib/collections/moderatorActions/constants";
import { maybeDate } from "@/lib/utils/dateUtils";
import partition from 'lodash/partition';

function getActiveModeratorActions(user: SunshineUsersList): ModeratorActionDisplay[] {
  return user.moderatorActions?.filter(action => action.active).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) ?? [];
}

export function partitionModeratorActions(user: SunshineUsersList): { fresh: ModeratorActionDisplay[], stale: ModeratorActionDisplay[] } {
  const activeModeratorActions = getActiveModeratorActions(user);
  const [fresh, stale] = partition(
    activeModeratorActions,
    action => {
      const actionCreatedAtTs = new Date(action.createdAt).getTime();
      const lastRemovedFromReviewQueueAtTs = maybeDate(user.lastRemovedFromReviewQueueAt)?.getTime() ?? 0;
      return actionCreatedAtTs > lastRemovedFromReviewQueueAtTs;
    }
  );

  return { fresh, stale };
}

/**
 * Condensed groups:
 * 1. UNREVIEWED_FIRST_POST, UNREVIEWED_FIRST_COMMENT (new user content)
 * 2. POTENTIAL_TARGETED_DOWNVOTING, RECEIVED_VOTING_PATTERN_WARNING, AUTO_BLOCKED_FROM_SENDING_DMS, FLAGGED_FOR_N_DMS, MANUAL_FLAG_ALERT, MANUAL_NEEDS_REVIEW, MANUAL_RATE_LIMIT_EXPIRED (high context)
 * 3. UNREVIEWED_BIO_UPDATE (maybe spam)
 * 4. RECEIVED_SENIOR_DOWNVOTES_ALERT, STRICTER_COMMENT_AUTOMOD_RATE_LIMIT, STRICTER_POST_AUTOMOD_RATE_LIMIT (keeping up with joneses)
 */

export const REVIEW_GROUP_TO_PRIORITY = {
  newContent: 5,
  highContext: 4,
  maybeSpam: 3,
  automod: 2,
  unknown: 1,
} as const;

type ReviewGroupMap = typeof REVIEW_GROUP_TO_PRIORITY;
export type ReviewGroup = keyof ReviewGroupMap;

const PRIORITY_TO_REVIEW_GROUP = Object.fromEntries(
  Object.entries(REVIEW_GROUP_TO_PRIORITY).map(([group, priority]) => [priority, group])
) as {
  [key in ReviewGroup as ReviewGroupMap[key]]: key;
};

function getModeratorActionGroup(action: ModeratorActionDisplay): ReviewGroup {
  switch (action.type) {
    case UNREVIEWED_FIRST_POST:
    case UNREVIEWED_FIRST_COMMENT:
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
    case RECEIVED_SENIOR_DOWNVOTES_ALERT:
    case STRICTER_COMMENT_AUTOMOD_RATE_LIMIT:
    case STRICTER_POST_AUTOMOD_RATE_LIMIT:
      return 'automod'
    default:
      return 'unknown';
  }
}

export function getUserReviewGroup(user: SunshineUsersList): ReviewGroup {
  const { fresh } = partitionModeratorActions(user);
  if (fresh.length === 0) {
    return 'unknown';
  }

  const freshModeratorActionGroups = fresh.map(getModeratorActionGroup);
  const highestPriority = Math.max(...freshModeratorActionGroups.map(group => REVIEW_GROUP_TO_PRIORITY[group])) as ReviewGroupMap[ReviewGroup];
  return PRIORITY_TO_REVIEW_GROUP[highestPriority];
}
