import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';
import MetaInfo from '@/components/common/MetaInfo';
import FlagIcon from '@/lib/vendor/@material-ui/icons/src/Flag';
import FirstContentIcons from '../FirstContentIcons';
import { getReasonForReview } from '@/lib/collections/moderatorActions/helpers';
import { getUserEmail } from '@/lib/collections/users/helpers';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description'
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message'
import { usePublishedPosts } from '@/components/hooks/usePublishedPosts';

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
    backgroundColor: theme.palette.grey[100],
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
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
}));

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

  const { reason } = getReasonForReview(user);

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
        <DescriptionIcon className={classes.icon} />
        {user.postCount || 0}
        <MessageIcon className={classes.icon} />
        {user.commentCount || 0}
      </div>
      <div className={classes.icons}>
        {/* <FirstContentIcons user={user} /> */}
        {user.sunshineFlagged && <FlagIcon className={classes.flagIcon} />}
      </div>
      {reason && reason !== 'alreadyApproved' && reason !== 'noReview' && (
        <div className={classes.badge}>
          {reason === 'firstPost' && 'Post'}
          {reason === 'firstComment' && 'Comment'}
          {reason === 'bio' && 'Bio'}
          {reason === 'mapLocation' && 'Location'}
          {reason === 'profileImage' && 'Image'}
          {reason === 'contactedTooManyUsers' && 'Spam'}
          {reason === 'newContent' && 'New Content'}
        </div>
      )}
      {showEmail && (
        <div className={classes.email}>
          {getUserEmail(user) || 'No email'}
        </div>
      )}
    </div>
  );
};

export default ModerationInboxItem;
