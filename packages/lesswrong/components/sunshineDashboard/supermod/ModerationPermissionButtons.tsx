'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import KeystrokeDisplay from './KeystrokeDisplay';
import type { InboxAction } from './inboxReducer';
import { useUserContentPermissions } from './useUserContentPermissions';
import { getActionHighlightStyle, type HighlightableModeratorAction, type ModeratorActionHighlightLevel } from './actionHighlightRules';
import { moderatorActionHighlightStyles } from './ModerationActionButton';

const styles = defineStyles('ModerationPermissionButtons', (theme: ThemeType) => ({
  permissionButtonsContainer: {
    display: 'flex',
    gap: 4,
  },
  permissionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 4px 4px 8px',
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
  ...moderatorActionHighlightStyles(theme),
  permissionButtonLabel: {
    flexGrow: 1,
  },
}));

const ModerationPermissionButtons = ({
  user,
  dispatch,
  highlightedActions,
  onlyHighlighted=false,
}: {
  user: SunshineUsersList;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  highlightedActions?: Map<HighlightableModeratorAction, ModeratorActionHighlightLevel>;
  onlyHighlighted?: boolean;
}) => {
  const classes = useStyles(styles);

  const {
    toggleDisablePosting,
    toggleDisableCommenting,
    toggleDisableMessaging,
    toggleDisableVoting,
  } = useUserContentPermissions(user, dispatch);

  const messagingHighlighted = !!highlightedActions?.has('disableMessages');
  const messageHighlightStyle = getActionHighlightStyle('disableMessages', highlightedActions?.get('disableMessages'), onlyHighlighted);

  const messageButton = (
    <div 
      className={classNames(classes.permissionButton, user.conversationsDisabled && 'active', messageHighlightStyle && classes[messageHighlightStyle])}
      onClick={toggleDisableMessaging}
    >
      <span className={classes.permissionButtonLabel}>Message</span>
      <KeystrokeDisplay keystroke="M" withMargin activeContext={!!user.conversationsDisabled} />
    </div>
  );

  // When showing only the highlighted buttons (i.e. while the section is collapsed),
  // render the button bare so it flows together in the parent's wrapping row.
  if (onlyHighlighted) {
    return messagingHighlighted ? messageButton : null;
  }

  return (
    <div className={classes.permissionButtonsContainer}>
      <div 
        className={classNames(classes.permissionButton, user.postingDisabled && 'active')}
        onClick={toggleDisablePosting}
      >
        <span className={classes.permissionButtonLabel}>Post</span>
        <KeystrokeDisplay keystroke="D" withMargin activeContext={!!user.postingDisabled} />
      </div>
      <div 
        className={classNames(classes.permissionButton, user.allCommentingDisabled && 'active')}
        onClick={toggleDisableCommenting}
      >
        <span className={classes.permissionButtonLabel}>Comment</span>
        <KeystrokeDisplay keystroke="C" withMargin activeContext={!!user.allCommentingDisabled} />
      </div>
      {messageButton}
      <div 
        className={classNames(classes.permissionButton, user.votingDisabled && 'active')}
        onClick={() => toggleDisableVoting()}
      >
        <span className={classes.permissionButtonLabel}>Vote</span>
        <KeystrokeDisplay keystroke="V" withMargin activeContext={!!user.votingDisabled} />
      </div>
    </div>
  );
};

export default ModerationPermissionButtons;
