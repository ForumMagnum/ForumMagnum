import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import ModerationActionButton from './ModerationActionButton';
import ModerationPermissionButtons from './ModerationPermissionButtons';
import { useModerationUserActions } from './useModerationUserActions';
import { useUserContentPermissions } from './useUserContentPermissions';
import type { InboxAction } from './inboxReducer';
import { areAllContentPermissionsDisabled } from './helpers';
import type { HighlightableModeratorAction, HighlightedModeratorActions } from './highlightRules';

const styles = defineStyles('ModerationActionButtons', (theme: ThemeType) => ({
  actionColumns: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
    // Room for the highlight ring, which the scrolling section body would otherwise clip
    padding: 1,
  },
  collapsedActionColumns: {
    marginBottom: 0,
    padding: 0,
    '& > :first-child': {
      paddingLeft: 4,
    },
  },
  // Equal widths so the right column's x doesn't depend on label lengths
  actionColumn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    '&:empty': {
      display: 'none',
    },
  },
}));

interface ModeratorActionButtonSpec {
  label: string;
  keystroke: string;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  highlightKey: HighlightableModeratorAction;
}

const ModerationActionButtonList = ({buttons, highlightedActions, collapsed}: {
  buttons: ModeratorActionButtonSpec[];
  highlightedActions: HighlightedModeratorActions;
  collapsed: boolean;
}) => <>
  {buttons.filter(({highlightKey}) => !collapsed || highlightedActions.has(highlightKey)).map(({label, keystroke, tooltip, onClick, active, highlightKey}) => (
    <ModerationActionButton
      key={label}
      label={label}
      keystroke={keystroke}
      tooltip={tooltip}
      onClick={onClick}
      active={!!active}
      highlightStyle={collapsed ? null : highlightedActions.get(highlightKey)}
    />
  ))}
</>;

const ModerationActionButtons = ({user, currentUser, addToUndoQueue, dispatch, highlightedActions, collapsed=false}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  highlightedActions: HighlightedModeratorActions;
  // Collapsed, show only the highlighted actions and permissions
  collapsed?: boolean;
}) => {
  const classes = useStyles(styles);

  const {
    handleReview,
    handleApproveCurrentOnly,
    handleSnoozeChoice,
    handleRemoveNeedsReview,
    handlePurge,
  } = useModerationUserActions({ selectedUser: user, currentUser, addToUndoQueue, dispatch });

  const { toggleAllPermissions } = useUserContentPermissions(user, dispatch);
  const allPermissionsDisabled = areAllContentPermissionsDisabled(user);

  const restrictiveActionButtons: ModeratorActionButtonSpec[] = [
    {
      label: 'Snooze',
      keystroke: 'S',
      tooltip: "Remove this user from the review queue; they'll return after the chosen N number of posts and comments.",
      onClick: handleSnoozeChoice,
      highlightKey: 'snoozeCustom',
    },
    {
      label: 'Unapprove & Remove',
      keystroke: 'Q',
      tooltip: "Remove this user from the review queue without approving them or snoozing. Their content stays unreviewed. Signs a 'removed from review queue without snooze/approval' note in their moderator notes.",
      onClick: handleRemoveNeedsReview,
      highlightKey: 'remove',
    },
    {
      label: 'Purge',
      keystroke: 'P',
      tooltip: "Deletes all of this user's posts, comments, sequences, and votes, bans them for 1000 years, and removes them from the review queue. Asks for confirmation first, and signs a 'Purge' note in their moderator notes.",
      onClick: handlePurge,
      highlightKey: 'purge',
    },
    {
      label: allPermissionsDisabled ? 'Enable Permissions' : 'Disable Permissions',
      keystroke: 'Shift+P',
      tooltip: allPermissionsDisabled
        ? "Re-enable posting, commenting, messaging, and voting. Signs an 'all permissions enabled' note in their moderator notes."
        : "Disable posting, commenting, messaging, and voting. Signs an 'all permissions disabled' note in their moderator notes.",
      onClick: toggleAllPermissions,
      active: allPermissionsDisabled,
      highlightKey: 'disablePermissions',
    },
  ];

  const approveActionButtons: ModeratorActionButtonSpec[] = [
    {
      label: 'Approve',
      keystroke: 'A',
      tooltip: "Approve this user and all their content. Marks them as reviewed by you, so their future posts and comments no longer need review. Clears any snooze and any flag, and signs an 'Approved' note in their moderator notes.",
      onClick: handleReview,
      highlightKey: 'approve',
    },
    {
      label: 'Approve, then Unapprove',
      keystroke: 'Shift+A',
      tooltip: "Approve this user's existing unreviewed posts and comments and remove them from the queue, without marking the user as reviewed, so their future content will still need review. Also clears any snooze and any flag.",
      onClick: handleApproveCurrentOnly,
      highlightKey: 'approveCurrentOnly',
    },
  ];

  return (
    <div className={classNames(classes.actionColumns, collapsed && classes.collapsedActionColumns)}>
      <div className={classes.actionColumn}>
        <ModerationActionButtonList buttons={restrictiveActionButtons} highlightedActions={highlightedActions} collapsed={collapsed} />
        {collapsed && <ModerationPermissionButtons user={user} dispatch={dispatch} highlightedActions={highlightedActions} collapsed />}
      </div>
      <div className={classes.actionColumn}>
        <ModerationActionButtonList buttons={approveActionButtons} highlightedActions={highlightedActions} collapsed={collapsed} />
      </div>
    </div>
  );
};

export default ModerationActionButtons;
