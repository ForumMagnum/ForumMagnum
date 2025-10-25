import React from 'react';
import { AUTO_BLOCKED_FROM_SENDING_DMS, FLAGGED_FOR_N_DMS, MANUAL_FLAG_ALERT, MANUAL_NEEDS_REVIEW, MANUAL_RATE_LIMIT_EXPIRED, POTENTIAL_TARGETED_DOWNVOTING, RECEIVED_SENIOR_DOWNVOTES_ALERT, RECEIVED_VOTING_PATTERN_WARNING, reviewTriggerModeratorActions, SNOOZE_EXPIRED, STRICTER_COMMENT_AUTOMOD_RATE_LIMIT, STRICTER_POST_AUTOMOD_RATE_LIMIT, UNREVIEWED_BIO_UPDATE, UNREVIEWED_FIRST_COMMENT, UNREVIEWED_FIRST_POST, UNREVIEWED_MAP_LOCATION_UPDATE, UNREVIEWED_PROFILE_IMAGE_UPDATE } from "@/lib/collections/moderatorActions/constants";
import { maybeDate } from "@/lib/utils/dateUtils";
import partition from 'lodash/partition';
import ForumIcon, { ForumIconName } from '@/components/common/ForumIcon'
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

function getActiveModeratorActions(moderatorActions: ModeratorActionDisplay[]): ModeratorActionDisplay[] {
  return moderatorActions.filter(action => action.active).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) ?? [];
}

interface PartitionedModeratorActions {
  fresh: ModeratorActionDisplay[];
  stale: ModeratorActionDisplay[];
  nonTriggerActions: ModeratorActionDisplay[];
}

export function partitionModeratorActions(user: SunshineUsersList): PartitionedModeratorActions {
  const [triggerActions, nonTriggerActions] = partition(user.moderatorActions ?? [], action => reviewTriggerModeratorActions.has(action.type));

  const activeModeratorActions = getActiveModeratorActions(triggerActions);
  const [fresh, stale] = partition(
    activeModeratorActions,
    action => {
      const actionCreatedAtTs = new Date(action.createdAt).getTime();
      const lastRemovedFromReviewQueueAtTs = maybeDate(user.lastRemovedFromReviewQueueAt)?.getTime() ?? 0;
      return actionCreatedAtTs > lastRemovedFromReviewQueueAtTs;
    }
  );

  return { fresh, stale, nonTriggerActions };
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

export function getDisplayedReasonForGroupAssignment(user: SunshineUsersList): React.ReactNode {
  const { fresh } = partitionModeratorActions(user);
  if (fresh.length === 0) {
    return undefined;
  }

  const highestPriorityAction = fresh
    .sort((a, b) => REVIEW_GROUP_TO_PRIORITY[getModeratorActionGroup(b)] - REVIEW_GROUP_TO_PRIORITY[getModeratorActionGroup(a)])
    .at(0);

  if (!highestPriorityAction) {
    return undefined;
  }

  return getPrimaryDisplayedModeratorAction(highestPriorityAction.type);
}

export function getTabsInPriorityOrder(): ReviewGroup[] {
  return ['newContent', 'highContext', 'maybeSpam', 'automod', 'unknown'];
}

export function getReviewGroupDisplayName(group: ReviewGroup | 'all'): string {
  switch (group) {
    case 'newContent':
      return 'New Content';
    case 'highContext':
      return 'High Context';
    case 'maybeSpam':
      return 'Maybe Spam';
    case 'automod':
      return 'Automod';
    case 'unknown':
      return 'Unknown';
    case 'all':
      return 'All';
  }
}

const styles = defineStyles('BadgeIcon', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    height: 12,
    width: 12,
  },
}));

const BadgeIcon = ({ icon, prefix, suffix }: { icon: ForumIconName, prefix?: string, suffix?: string }) => {
  const classes = useStyles(styles);
  return <span className={classes.root}>{prefix && `${prefix} `}<ForumIcon icon={icon} className={classes.icon} />{suffix && `${suffix} `}</span>;
};

export function getPrimaryDisplayedModeratorAction(moderatorActionType: ModeratorActionType): React.ReactNode {
  switch (moderatorActionType) {
    case MANUAL_NEEDS_REVIEW:
      return 'Manual';
    case MANUAL_FLAG_ALERT:
      return 'Flagged';
    case FLAGGED_FOR_N_DMS:
      return 'DM Count';
    case AUTO_BLOCKED_FROM_SENDING_DMS:
      return 'DM Block';
    case RECEIVED_VOTING_PATTERN_WARNING:
      return 'Fast Voting';
    case POTENTIAL_TARGETED_DOWNVOTING:
      return 'Targeted Downvoting';
    case RECEIVED_SENIOR_DOWNVOTES_ALERT:
      return 'Senior Downvotes';
    case UNREVIEWED_BIO_UPDATE:
      return 'Bio Update';
    case UNREVIEWED_MAP_LOCATION_UPDATE:
      return 'Location Update';
    case UNREVIEWED_PROFILE_IMAGE_UPDATE:
      return 'Image Update';
    case UNREVIEWED_FIRST_POST:
      return <BadgeIcon icon="Post" prefix="First" />;
    case UNREVIEWED_FIRST_COMMENT:
      return <BadgeIcon icon="ModDashboardComment" prefix="First" />;
    case SNOOZE_EXPIRED:
      return <BadgeIcon icon="Snooze" suffix="Expired" />;
    case STRICTER_COMMENT_AUTOMOD_RATE_LIMIT:
      return 'Stricter Comment RL';
    case STRICTER_POST_AUTOMOD_RATE_LIMIT:
      return 'Stricter Post RL';
    case MANUAL_RATE_LIMIT_EXPIRED:
      return 'Manual RL Expired';
    default:
      return `${moderatorActionType} - unexpected`;
  }
}
