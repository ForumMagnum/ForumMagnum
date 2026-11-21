'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import KeystrokeDisplay from './KeystrokeDisplay';
import type { InboxAction } from './inboxReducer';
import { useUserContentPermissions } from './useUserContentPermissions';
import type { ContentPermissionField } from './helpers';

const styles = defineStyles('ModerationPermissionButtons', (theme: ThemeType) => ({
  permissionButtonsContainer: {
    display: 'flex',
    gap: 4,
  },
  permissionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    padding: '4px 8px 4px 4px',
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
  barePermissionButton: {
    padding: '2px 4px',
    border: 0,
    borderRadius: 0,
    boxShadow: 'none',
    backgroundColor: 'transparent',
    '&:hover': {
      border: 0,
      boxShadow: 'none',
    },
    '&.active': {
      border: 0,
      boxShadow: 'none',
    },
  },
  permissionButtonLabel: {
    flexGrow: 1,
  },
}));

interface ContentPermissionButtonSpec {
  field: ContentPermissionField;
  label: string;
  keystroke: string;
  onClick: () => void;
}

const ModerationPermissionButtons = ({
  user,
  dispatch,
  collapsed=false,
}: {
  user: SunshineUsersList;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  collapsed?: boolean;
}) => {
  const classes = useStyles(styles);

  const {
    toggleDisablePosting,
    toggleDisableCommenting,
    toggleDisableMessaging,
    toggleDisableVoting,
  } = useUserContentPermissions(user, dispatch);

  const permissionButtons: ContentPermissionButtonSpec[] = [
    { field: 'postingDisabled', label: 'Post', keystroke: 'D', onClick: toggleDisablePosting },
    { field: 'allCommentingDisabled', label: 'Comment', keystroke: 'C', onClick: toggleDisableCommenting },
    { field: 'conversationsDisabled', label: 'Message', keystroke: 'M', onClick: toggleDisableMessaging },
    { field: 'votingDisabled', label: 'Vote', keystroke: 'V', onClick: () => toggleDisableVoting() },
  ];

  // Collapsed, we keep the permissions a moderator has already revoked, so the revocation
  // stays visible without expanding.
  const visibleButtons = collapsed
    ? permissionButtons.filter(({field}) => user[field])
    : permissionButtons;

  const renderedButtons = visibleButtons.map(({field, label, keystroke, onClick}) => {
    const permissionDisabled = !!user[field];

    return (
      <div
        key={field}
        className={classNames(
          classes.permissionButton,
          permissionDisabled && 'active',
          collapsed && classes.barePermissionButton,
        )}
        onClick={onClick}
      >
        <KeystrokeDisplay keystroke={keystroke} activeContext={permissionDisabled} />
        <span className={classes.permissionButtonLabel}>{label}</span>
      </div>
    );
  });

  // Rendered bare while collapsed, so they flow with the other keyboard-first command rows.
  if (collapsed) {
    return <>{renderedButtons}</>;
  }

  return <div className={classes.permissionButtonsContainer}>{renderedButtons}</div>;
};

export default ModerationPermissionButtons;
