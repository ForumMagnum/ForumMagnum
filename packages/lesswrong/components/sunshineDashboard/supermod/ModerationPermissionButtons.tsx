'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import KeystrokeDisplay from './KeystrokeDisplay';
import type { InboxAction } from './inboxReducer';
import { useUserContentPermissions } from './useUserContentPermissions';
import type { ContentPermissionField } from './helpers';
import { activeCommandButtonStyles, moderatorActionHighlightStyles } from './ModerationActionButton';
import type { HighlightableModeratorAction, HighlightedModeratorActions } from './highlightRules';

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
      ...activeCommandButtonStyles(theme),
      borderColor: theme.palette.error.main,
    },
  },
  ...moderatorActionHighlightStyles(theme),
  barePermissionButton: {
    padding: '2px 0',
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
  highlightKey?: HighlightableModeratorAction;
}

const ModerationPermissionButtons = ({
  user,
  dispatch,
  highlightedActions,
  collapsed=false,
}: {
  user: SunshineUsersList;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  highlightedActions: HighlightedModeratorActions;
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
    { field: 'conversationsDisabled', label: 'Message', keystroke: 'M', onClick: toggleDisableMessaging, highlightKey: 'disableMessages' },
    { field: 'votingDisabled', label: 'Vote', keystroke: 'V', onClick: () => toggleDisableVoting() },
  ];

  // Collapsed, show only suggested permissions
  const visibleButtons = collapsed
    ? permissionButtons.filter(({highlightKey}) => highlightKey && highlightedActions.has(highlightKey))
    : permissionButtons;

  const renderedButtons = visibleButtons.map(({field, label, keystroke, onClick, highlightKey}) => {
    const permissionDisabled = !!user[field];
    const highlightStyle = highlightKey && !collapsed ? highlightedActions.get(highlightKey) : null;

    return (
      <div
        key={field}
        className={classNames(
          classes.permissionButton,
          permissionDisabled && 'active',
          highlightStyle && classes[highlightStyle],
          collapsed && classes.barePermissionButton,
        )}
        onClick={onClick}
      >
        <KeystrokeDisplay keystroke={keystroke} activeContext={permissionDisabled} />
        <span className={classes.permissionButtonLabel}>{label}</span>
      </div>
    );
  });

  if (collapsed) {
    return <>{renderedButtons}</>;
  }

  return <div className={classes.permissionButtonsContainer}>{renderedButtons}</div>;
};

export default ModerationPermissionButtons;
