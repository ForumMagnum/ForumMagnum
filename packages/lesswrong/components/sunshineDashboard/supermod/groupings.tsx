import React from 'react';
import { AUTO_BLOCKED_FROM_SENDING_DMS, FLAGGED_FOR_N_DMS, MANUAL_FLAG_ALERT, MANUAL_NEEDS_REVIEW, MANUAL_RATE_LIMIT_EXPIRED, POTENTIAL_TARGETED_DOWNVOTING, RECEIVED_VOTING_PATTERN_WARNING, reviewTriggerModeratorActions, SNOOZE_EXPIRED, STRICTER_COMMENT_AUTOMOD_RATE_LIMIT, STRICTER_POST_AUTOMOD_RATE_LIMIT, UNREVIEWED_BIO_UPDATE, UNREVIEWED_COMMENT, UNREVIEWED_FIRST_COMMENT, UNREVIEWED_FIRST_POST, UNREVIEWED_MAP_LOCATION_UPDATE, UNREVIEWED_POST, UNREVIEWED_PROFILE_IMAGE_UPDATE } from "@/lib/collections/moderatorActions/constants";
import partition from 'lodash/partition';
import ForumIcon, { ForumIconName } from '@/components/common/ForumIcon'
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { getFreshReviewTriggerActions, getModeratorActionGroup, typeAssertModeratorActionTypeIsNotReviewTrigger } from '@/lib/collections/users/reviewGroups';

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
  const fresh = getFreshReviewTriggerActions(activeModeratorActions, user.lastRemovedFromReviewQueueAt);
  const stale = activeModeratorActions.filter(action => !fresh.includes(action));

  return { fresh, stale, nonTriggerActions };
}

export type TabId = ReviewGroup | 'all' | 'posts' | 'classifiedPosts' | 'curation';

// Computed server-side via the `reviewGroup` resolver on the User schema.
export function getUserReviewGroup(user: SunshineUsersList): ReviewGroup {
  return user.reviewGroup ?? 'unknown';
}

export function getDisplayedReasonForGroupAssignment(user: SunshineUsersList): React.ReactNode {
  const reviewGroup = getUserReviewGroup(user);
  const { fresh } = partitionModeratorActions(user);
  const actionForGroup = fresh.find(action => getModeratorActionGroup(action.type) === reviewGroup);
  if (!actionForGroup) {
    return undefined;
  }

  return getPrimaryDisplayedModeratorAction(actionForGroup.type);
}

export function getTabsInPriorityOrder(): ReviewGroup[] {
  return ['newContent', 'offboard', 'highContext', 'maybeSpam', 'automod', 'snoozeExpired', 'unknown'];
}

export function getReviewGroupDisplayName(group: TabId): string {
  switch (group) {
    case 'newContent':
      return 'New Content';
    case 'offboard':
      return 'Offboard?';
    case 'highContext':
      return 'High Context';
    case 'maybeSpam':
      return 'Maybe Spam';
    case 'automod':
      return 'Automod';
    case 'snoozeExpired':
      return 'Snooze Expired';
    case 'unknown':
      return 'Unknown';
    case 'all':
      return 'All';
    case 'posts':
      return 'Posts';
    case 'classifiedPosts':
      return 'Auto-Classified';
    case 'curation':
      return 'Curation';
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
    case UNREVIEWED_POST:
      return <BadgeIcon icon="Post" prefix="Unreviewed" />;
    case UNREVIEWED_COMMENT:
      return <BadgeIcon icon="ModDashboardComment" prefix="Unreviewed" />;
    case SNOOZE_EXPIRED:
      return <BadgeIcon icon="Snooze" suffix="Expired" />;
    case STRICTER_COMMENT_AUTOMOD_RATE_LIMIT:
      return 'Stricter Comment RL';
    case STRICTER_POST_AUTOMOD_RATE_LIMIT:
      return 'Stricter Post RL';
    case MANUAL_RATE_LIMIT_EXPIRED:
      return 'Manual RL Expired';
    default:
      typeAssertModeratorActionTypeIsNotReviewTrigger(moderatorActionType);
      return `${moderatorActionType} - unexpected`;
  }
}
