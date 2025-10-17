import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';
import FlagIcon from '@/lib/vendor/@material-ui/icons/src/Flag';
import { getReasonForReview } from '@/lib/collections/moderatorActions/helpers';
import { getUserEmail } from '@/lib/collections/users/helpers';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description'
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message'
import { usePublishedPosts } from '@/components/hooks/usePublishedPosts';
import { AUTO_BLOCKED_FROM_SENDING_DMS, FLAGGED_FOR_N_DMS, MANUAL_FLAG_ALERT, MANUAL_NEEDS_REVIEW, MANUAL_RATE_LIMIT_EXPIRED, POTENTIAL_TARGETED_DOWNVOTING, RECEIVED_SENIOR_DOWNVOTES_ALERT, RECEIVED_VOTING_PATTERN_WARNING, SNOOZE_EXPIRED, STRICTER_COMMENT_AUTOMOD_RATE_LIMIT, STRICTER_POST_AUTOMOD_RATE_LIMIT, UNREVIEWED_BIO_UPDATE, UNREVIEWED_FIRST_COMMENT, UNREVIEWED_FIRST_POST, UNREVIEWED_MAP_LOCATION_UPDATE, UNREVIEWED_PROFILE_IMAGE_UPDATE } from '@/lib/collections/moderatorActions/constants';
import { partitionModeratorActions } from './groupings';
import ForumIcon from '@/components/common/ForumIcon';

const styles = defineStyles('ModerationInboxItem', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: theme.palette.border.faint,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
    ...theme.typography.commentStyle,
  },
  focused: {
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    paddingLeft: 17, // 20 - 3 to account for border
  },
  flagged: {
    backgroundColor: theme.palette.panelBackground.sunshineFlaggedUser,
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.sunshineFlaggedUser,
    },
  },
  displayName: {
    fontSize: 15,
    fontWeight: 500,
    color: theme.palette.grey[900],
    marginRight: 12,
    width: 140,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  karma: {
    fontSize: 13,
    marginRight: 12,
    minWidth: 30,
    textAlign: 'right',
  },
  karmaPositive: {
    color: theme.palette.primary.main,
  },
  karmaNegative: {
    color: theme.palette.error.main,
  },
  karmaLow: {
    color: theme.palette.grey[600],
  },
  createdAt: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginRight: 12,
    minWidth: 24,
  },
  icons: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 12,
    width: 20,
  },
  flagIcon: {
    height: 14,
    width: 14,
    color: theme.palette.error.main,
    marginLeft: 4,
  },
  badge: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 3,
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
    marginRight: 8,
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  staleBadge: {
    opacity: 0.5,
  },
  email: {
    fontSize: 12,
    color: theme.palette.grey[500],
    marginLeft: 'auto',
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  contentCounts: {
    color: theme.palette.grey[600],
    display: 'flex',
  },
  contentCountItem: {
    width: 40,
  },
  wideContentCountItem: {
    width: 50,
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
}));

function getPrimaryDisplayedModeratorAction(moderatorActionType: ModeratorActionType): string {
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
      return 'First Post';
    case UNREVIEWED_FIRST_COMMENT:
      return 'First Comment';
    case SNOOZE_EXPIRED:
      return 'Snooze Expired';
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

function getFallbackDisplayedModeratorAction(user: SunshineUsersList): string | undefined {
  const { reason } = getReasonForReview(user);
  switch (reason) {
    case 'firstPost':
      return 'First Post';
    case 'firstComment':
      return 'First Comment';
    case 'bio':
      return 'Bio Update';
    case 'mapLocation':
      return 'Location Update';
    case 'profileImage':
      return 'Image Update';
    case 'contactedTooManyUsers':
      return 'DM Count';
    case 'newContent':
      return 'Snooze Expired';
    case 'alreadyApproved':
    case 'noReview':
      return undefined;
  }
}

const ModerationInboxItem = ({
  user,
  isFocused,
  onFocus,
  onOpen,
}: {
  user: SunshineUsersList;
  isFocused: boolean;
  onFocus: () => void;
  onOpen: () => void;
}) => {
  const classes = useStyles(styles);

  // const { posts = [] } = usePublishedPosts(user._id, 5);

  const fallbackDisplayedModeratorAction = getFallbackDisplayedModeratorAction(user);

  const { fresh: freshModeratorActions, stale: staleModeratorActions } = partitionModeratorActions(user);
  const freshModeratorActionBadges = freshModeratorActions.map(action => getPrimaryDisplayedModeratorAction(action.type));
  const staleModeratorActionBadges = staleModeratorActions.map(action => getPrimaryDisplayedModeratorAction(action.type));
  const allModeratorActionBadges = [...freshModeratorActionBadges, ...staleModeratorActionBadges];

  const karma = user.karma;
  const karmaClass = karma < 0 ? classes.karmaNegative : karma < 10 ? classes.karmaLow : classes.karmaPositive;

  const showEmail = !user.reviewedByUserId;

  return (
    <div
      className={classNames(classes.root, {
        [classes.focused]: isFocused,
        [classes.flagged]: user.sunshineFlagged,
      })}
      onClick={onOpen}
    >
      <div className={classes.displayName}>
        {user.displayName}
      </div>
      <div className={classNames(classes.karma, karmaClass)}>
        {karma}
      </div>
      <div className={classes.createdAt}>
        <FormatDate date={user.createdAt} />
      </div>
      <div className={classes.contentCounts}>
        <span className={classes.contentCountItem}>
          <DescriptionIcon className={classes.icon} />
          {user.postCount}
        </span>
        <span className={classes.wideContentCountItem}>
          <MessageIcon className={classes.icon} />
          {user.commentCount}
        </span>
        <span className={classes.contentCountItem}>
          <ForumIcon icon="Email" className={classes.icon} />
          {user.usersContactedBeforeReview?.length ?? 0}
        </span>
      </div>
      <div className={classes.icons}>
        {user.sunshineFlagged && <FlagIcon className={classes.flagIcon} />}
      </div>
      {freshModeratorActionBadges.map((badge, index) => (
        <div className={classes.badge} key={index}>
          {badge}
        </div>
      ))}
      {fallbackDisplayedModeratorAction && !allModeratorActionBadges.includes(fallbackDisplayedModeratorAction) && (
        <div className={classNames(classes.badge, classes.staleBadge)}>
          {fallbackDisplayedModeratorAction} (fallback)
        </div>
      )}
      {staleModeratorActionBadges.map((badge, index) => (
        <div className={classNames(classes.badge, classes.staleBadge)} key={index}>
          {badge}
        </div>
      ))}

      {showEmail && (
        <div className={classes.email}>
          {getUserEmail(user) || 'No email'}
        </div>
      )}
    </div>
  );
};

export default ModerationInboxItem;
