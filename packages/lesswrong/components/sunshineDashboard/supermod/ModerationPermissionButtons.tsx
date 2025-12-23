import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import KeystrokeDisplay from './KeystrokeDisplay';
import type { InboxAction } from './inboxReducer';
import { useUserContentPermissions } from './useUserContentPermissions';

const styles = defineStyles('ModerationPermissionButtons', (theme: ThemeType) => ({
  permissionButtonsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 4,
    width: 220,
  },
  permissionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 8px',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
      borderColor: theme.palette.grey[400],
    },
    '&.active': {
      backgroundColor: theme.palette.error.light,
      borderColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.error.main,
      },
    },
  },
  permissionButtonLabel: {
    flexGrow: 1,
  },
}));

const ModerationPermissionButtons = ({
  user,
  dispatch,
}: {
  user: SunshineUsersList;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);

  const {
    toggleDisablePosting,
    toggleDisableCommenting,
    toggleDisableMessaging,
    toggleDisableVoting,
  } = useUserContentPermissions(user, dispatch);

  return (
    <div className={classes.permissionButtonsContainer}>
      <div 
        className={classNames(classes.permissionButton, user.postingDisabled && 'active')}
        onClick={toggleDisablePosting}
      >
        <span className={classes.permissionButtonLabel}>Posting</span>
        <KeystrokeDisplay keystroke="D" withMargin activeContext={!!user.postingDisabled} />
      </div>
      <div 
        className={classNames(classes.permissionButton, user.allCommentingDisabled && 'active')}
        onClick={toggleDisableCommenting}
      >
        <span className={classes.permissionButtonLabel}>Commenting</span>
        <KeystrokeDisplay keystroke="C" withMargin activeContext={!!user.allCommentingDisabled} />
      </div>
      <div 
        className={classNames(classes.permissionButton, user.conversationsDisabled && 'active')}
        onClick={toggleDisableMessaging}
      >
        <span className={classes.permissionButtonLabel}>Messaging</span>
        <KeystrokeDisplay keystroke="M" withMargin activeContext={!!user.conversationsDisabled} />
      </div>
      <div 
        className={classNames(classes.permissionButton, user.votingDisabled && 'active')}
        onClick={() => toggleDisableVoting()}
      >
        <span className={classes.permissionButtonLabel}>Voting</span>
        <KeystrokeDisplay keystroke="V" withMargin activeContext={!!user.votingDisabled} />
      </div>
    </div>
  );
};

export default ModerationPermissionButtons;

