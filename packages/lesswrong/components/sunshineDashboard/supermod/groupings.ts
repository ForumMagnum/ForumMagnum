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
 * Priority ordering of active moderator action groups:
 * 1. MANUAL_FLAG_ALERT (contextual)
 * 2. UNREVIEWED_FIRST_POST, UNREVIEWED_FIRST_COMMENT (new user content, review content)
 * 3. POTENTIAL_TARGETED_DOWNVOTING (investigation)
 * 4. AUTO_BLOCKED_FROM_SENDING_DMS, FLAGGED_FOR_N_DMS (contextual, maybe DM them, maybe investigate)
 * 5. RECEIVED_VOTING_PATTERN_WARNING (contextual, maybe investigation)
 * 6. UNREVIEWED_BIO_UPDATE (check if spam - 99% either remove or purge)
 * 7. MANUAL_NEEDS_REVIEW (??? - I hope nobody is doing this without leaving mod notes)
 * 8. RECEIVED_SENIOR_DOWNVOTES_ALERT, STRICTER_COMMENT_AUTOMOD_RATE_LIMIT, STRICTER_POST_AUTOMOD_RATE_LIMIT (snooze/approve, or consider offboarding)
 * 9. MANUAL_RATE_LIMIT_EXPIRED (sanity check, then approve or think about offboarding)
 */
export const REVIEW_GROUP_TO_PRIORITY = {
  flagged: 10,
  newContent: 9,
  potentialTargetedDownvoting: 8,
  suspiciousDMs: 7,
  fastVoting: 6,
  maybeSpam: 5,
  manualReview: 4,
  automod: 3,
  rateLimitExpired: 2,
  unknown: 1,
} as const;

type ReviewGroupMap = typeof REVIEW_GROUP_TO_PRIORITY;
type ReviewGroup = keyof ReviewGroupMap;

const PRIORITY_TO_REVIEW_GROUP = Object.fromEntries(
  Object.entries(REVIEW_GROUP_TO_PRIORITY).map(([group, priority]) => [priority, group])
) as {
  [key in ReviewGroup as ReviewGroupMap[key]]: key;
};

function getModeratorActionGroup(action: ModeratorActionDisplay): ReviewGroup {
  switch (action.type) {
    case MANUAL_FLAG_ALERT:
      return 'flagged';
    case UNREVIEWED_FIRST_POST:
    case UNREVIEWED_FIRST_COMMENT:
      return 'newContent';
    case POTENTIAL_TARGETED_DOWNVOTING:
      return 'potentialTargetedDownvoting';
    case AUTO_BLOCKED_FROM_SENDING_DMS:
    case FLAGGED_FOR_N_DMS:
      return 'suspiciousDMs';
    case RECEIVED_VOTING_PATTERN_WARNING:
      return 'fastVoting';
    case UNREVIEWED_BIO_UPDATE:
    case UNREVIEWED_MAP_LOCATION_UPDATE:
    case UNREVIEWED_PROFILE_IMAGE_UPDATE:
      return 'maybeSpam';
    case MANUAL_NEEDS_REVIEW:
      return 'manualReview';
    case RECEIVED_SENIOR_DOWNVOTES_ALERT:
    case STRICTER_COMMENT_AUTOMOD_RATE_LIMIT:
    case STRICTER_POST_AUTOMOD_RATE_LIMIT:
      return 'automod';
    case MANUAL_RATE_LIMIT_EXPIRED:
      return 'rateLimitExpired';
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
