import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationActionButton from './ModerationActionButton';
import { useModerationUserActions } from './useModerationUserActions';
import { useUserContentPermissions } from './useUserContentPermissions';
import type { InboxAction } from './inboxReducer';
import { areAllContentPermissionsDisabled } from './helpers';
import { getActionHighlightStyle, type HighlightableModeratorAction, type ModeratorActionHighlightLevel } from './actionHighlightRules';

const styles = defineStyles('ModerationActionButtons', (theme: ThemeType) => ({
  actionsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 8,
    marginBottom: 12,
  },
  actionRow: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },
}));

const ModerationActionButtons = ({user, currentUser, addToUndoQueue, dispatch, highlightedActions, onlyHighlighted=false}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  highlightedActions?: Map<HighlightableModeratorAction, ModeratorActionHighlightLevel>;
  onlyHighlighted?: boolean;
}) => {
  const classes = useStyles(styles);

  const {
    handleReview,
    handleApproveCurrentOnly,
    handleSnooze,
    handleSnoozeCustom,
    handleRemoveNeedsReview,
    handlePurge,
  } = useModerationUserActions({ selectedUser: user, currentUser, addToUndoQueue });

  const { toggleAllPermissions } = useUserContentPermissions(user, dispatch);
  const allPermissionsDisabled = areAllContentPermissionsDisabled(user);

  const moderatorActionRows: Array<Array<{
    label: string;
    keystroke: string;
    tooltip: string;
    onClick: () => void;
    active?: boolean;
    highlightKey?: HighlightableModeratorAction;
  }>> = [
    [
      {
        label: 'Approve',
        keystroke: 'A',
        tooltip: "Approve this user and all their content. Marks them as reviewed by you, so their future posts and comments no longer need review. Clears any snooze and any flag, and signs an 'Approved' note in their moderator notes.",
        onClick: handleReview,
        highlightKey: 'approve',
      },
    ],
    [
      {
        label: 'Snooze 10',
        keystroke: 'S',
        tooltip: "Remove this user from the review queue for now; they'll return for review after their next 10 posts or comments. Signs a 'Snooze 10' note in their moderator notes.",
        onClick: () => handleSnooze(10),
      },
      {
        label: 'Snooze X',
        keystroke: 'Shift+S',
        tooltip: 'Same as Snooze 10, but opens a dialog to choose how many more posts or comments the user can make before they return to the review queue.',
        onClick: handleSnoozeCustom,
        highlightKey: 'snoozeCustom',
      },
      {
        label: 'Approve Current Only',
        keystroke: 'Shift+A',
        tooltip: "Approve this user's existing unreviewed posts and comments and remove them from the queue, without marking the user as reviewed, so their future content will still need review. Also clears any snooze and any flag.",
        onClick: handleApproveCurrentOnly,
        highlightKey: 'approveCurrentOnly',
      },
    ],
    [
      {
        label: 'Remove',
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
    ],
  ];

  // When showing only the highlighted actions (i.e. while the section is collapsed),
  // render the buttons bare so they all flow together in the parent's wrapping row.
  if (onlyHighlighted) {
    const highlightedButtons = moderatorActionRows
      .flat()
      .filter(({highlightKey}) => highlightKey && highlightedActions?.has(highlightKey));
    return <>
      {highlightedButtons.map(({label, keystroke, tooltip, onClick, active, highlightKey}) => (
        <ModerationActionButton
          key={label}
          label={label}
          keystroke={keystroke}
          tooltip={tooltip}
          onClick={onClick}
          active={!!active}
          highlightStyle={highlightKey ? getActionHighlightStyle(highlightKey, highlightedActions?.get(highlightKey), true) : null}
        />
      ))}
    </>;
  }

  return (
    <div className={classes.actionsColumn}>
      {moderatorActionRows.map((row, rowIndex) => (
        <div key={rowIndex} className={classes.actionRow}>
          {row.map(({label, keystroke, tooltip, onClick, active, highlightKey}) => (
            <ModerationActionButton
              key={label}
              label={label}
              keystroke={keystroke}
              tooltip={tooltip}
              onClick={onClick}
              active={!!active}
              highlightStyle={highlightKey ? getActionHighlightStyle(highlightKey, highlightedActions?.get(highlightKey), false) : null}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ModerationActionButtons;
