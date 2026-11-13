import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationActionButton from './ModerationActionButton';
import { useModerationUserActions } from './useModerationUserActions';
import { useUserContentPermissions } from './useUserContentPermissions';
import type { InboxAction } from './inboxReducer';
import { areAllContentPermissionsDisabled } from './helpers';
import { getActionHighlightStyle, type HighlightableModeratorAction } from './actionHighlightRules';
import type { ModeratorActionHighlightLevel } from '@/lib/moderatorHighlights/highlightRuleTypes';

const styles = defineStyles('ModerationActionButtons', (theme: ThemeType) => ({
  actionColumns: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  // Equal-width columns, so the right-hand column starts at the same x whatever
  // the longest label in the left-hand one happens to be for this user
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

/**
 * Actions which take away permissions or take the user out of the review queue go in
 * the left column; actions which approve the user's current content go in the right.
 */
export type ModeratorActionColumn = 'restrictive' | 'approve';

interface ModeratorActionButtonSpec {
  label: string;
  keystroke: string;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  highlightKey?: HighlightableModeratorAction;
  column: ModeratorActionColumn;
}

const ModerationActionButtonList = ({buttons, highlightedActions, collapsed}: {
  buttons: ModeratorActionButtonSpec[];
  highlightedActions?: Map<HighlightableModeratorAction, ModeratorActionHighlightLevel>;
  collapsed: boolean;
}) => <>
  {buttons.map(({label, keystroke, tooltip, onClick, active, highlightKey}) => (
    <ModerationActionButton
      key={label}
      label={label}
      keystroke={keystroke}
      tooltip={tooltip}
      onClick={onClick}
      active={!!active}
      highlightStyle={highlightKey ? getActionHighlightStyle(highlightKey, highlightedActions?.get(highlightKey), collapsed) : null}
    />
  ))}
</>;

const ModerationActionButtons = ({user, currentUser, addToUndoQueue, dispatch, highlightedActions, onlyHighlighted=false, column}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  highlightedActions?: Map<HighlightableModeratorAction, ModeratorActionHighlightLevel>;
  onlyHighlighted?: boolean;
  column?: ModeratorActionColumn;
}) => {
  const classes = useStyles(styles);

  const {
    handleReview,
    handleApproveCurrentOnly,
    handleSnoozeChoice,
    handleRemoveNeedsReview,
    handleRejectAllAndRemove,
    handlePurge,
    handleFlag,
  } = useModerationUserActions({ selectedUser: user, currentUser, addToUndoQueue, dispatch });

  const { toggleAllPermissions } = useUserContentPermissions(user, dispatch);
  const allPermissionsDisabled = areAllContentPermissionsDisabled(user);

  const moderatorActionButtons: ModeratorActionButtonSpec[] = [
    {
      label: 'Snooze',
      keystroke: 'S',
      tooltip: "Remove this user from the review queue; they'll return after the chosen N number of posts and comments.",
      onClick: handleSnoozeChoice,
      highlightKey: 'snoozeCustom',
      column: 'restrictive',
    },
    {
      label: 'Unapprove & Remove',
      keystroke: 'Q',
      tooltip: "Remove this user from the review queue without approving them or snoozing. Their content stays unreviewed. Signs a 'removed from review queue without snooze/approval' note in their moderator notes.",
      onClick: handleRemoveNeedsReview,
      highlightKey: 'remove',
      column: 'restrictive',
    },
    {
      label: 'Reject All & Remove',
      keystroke: 'Shift+X',
      tooltip: "Reject all of this user's pending content and remove them from the review queue. Asks for a rejection reason, which goes on their latest unapproved submission; each other rejected submission gets a notice pointing to it.",
      onClick: handleRejectAllAndRemove,
      column: 'restrictive',
    },
    {
      label: user.sunshineFlagged ? 'Unflag' : 'Flag',
      keystroke: 'F',
      tooltip: user.sunshineFlagged
        ? "Remove this user's flag. Signs an 'Unflag' note in their moderator notes."
        : "Flag this user for other moderators' attention. Signs a 'Flag' note in their moderator notes.",
      onClick: handleFlag,
      active: !!user.sunshineFlagged,
      column: 'restrictive',
    },
    {
      label: 'Purge',
      keystroke: 'P',
      tooltip: "Deletes all of this user's posts, comments, sequences, and votes, bans them for 1000 years, and removes them from the review queue. Asks for confirmation first, and signs a 'Purge' note in their moderator notes.",
      onClick: handlePurge,
      highlightKey: 'purge',
      column: 'restrictive',
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
      column: 'restrictive',
    },
    {
      label: 'Approve',
      keystroke: 'A',
      tooltip: "Approve this user and all their content. Marks them as reviewed by you, so their future posts and comments no longer need review. Clears any snooze and any flag, and signs an 'Approved' note in their moderator notes.",
      onClick: handleReview,
      highlightKey: 'approve',
      column: 'approve',
    },
    {
      label: 'Approve, then Unapprove',
      keystroke: 'Shift+A',
      tooltip: "Approve this user's existing unreviewed posts and comments and remove them from the queue, without marking the user as reviewed, so their future content will still need review. Also clears any snooze and any flag.",
      onClick: handleApproveCurrentOnly,
      highlightKey: 'approveCurrentOnly',
      column: 'approve',
    },
  ];

  // When the section is collapsed, only render the highlighted actions in each column.
  if (onlyHighlighted) {
    const highlightedButtons = moderatorActionButtons.filter(({highlightKey, column: buttonColumn}) => (
      (!column || buttonColumn === column) && highlightKey && highlightedActions?.has(highlightKey)
    ));
    return <ModerationActionButtonList buttons={highlightedButtons} highlightedActions={highlightedActions} collapsed />;
  }

  return (
    <div className={classes.actionColumns}>
      <div className={classes.actionColumn}>
        <ModerationActionButtonList
          buttons={moderatorActionButtons.filter(({column: buttonColumn}) => buttonColumn === 'restrictive')}
          highlightedActions={highlightedActions}
          collapsed={false}
        />
      </div>
      <div className={classes.actionColumn}>
        <ModerationActionButtonList
          buttons={moderatorActionButtons.filter(({column: buttonColumn}) => buttonColumn === 'approve')}
          highlightedActions={highlightedActions}
          collapsed={false}
        />
      </div>
    </div>
  );
};

export default ModerationActionButtons;
