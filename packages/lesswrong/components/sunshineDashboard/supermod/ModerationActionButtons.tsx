import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWTooltip from '@/components/common/LWTooltip';
import KeystrokeDisplay from './KeystrokeDisplay';
import { useModerationUserActions } from './useModerationUserActions';
import { useUserContentPermissions } from './useUserContentPermissions';
import type { InboxAction } from './inboxReducer';
import { areAllContentPermissionsDisabled } from './helpers';
import type { HighlightableModeratorAction } from './actionHighlightRules';
import classNames from 'classnames';

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
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    padding: '4px 4px 4px 6px',
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
  highlighted: {
    backgroundColor: theme.palette.grey[900],
    borderColor: theme.palette.grey[900],
    color: theme.palette.grey[100],
    fontWeight: 600,
    '&:hover': {
      backgroundColor: theme.palette.grey[800],
      borderColor: theme.palette.grey[800],
    },
  },
}));

const ModerationActionButtons = ({user, currentUser, addToUndoQueue, dispatch, highlightedActions, onlyHighlighted=false}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  highlightedActions?: Set<HighlightableModeratorAction>;
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

  const visibleActionRows = onlyHighlighted
    ? moderatorActionRows
        .map(row => row.filter(({highlightKey}) => highlightKey && highlightedActions?.has(highlightKey)))
        .filter(row => row.length > 0)
    : moderatorActionRows;

  if (visibleActionRows.length === 0) {
    return null;
  }

  return (
    <div className={classes.actionsColumn}>
      {visibleActionRows.map((row, rowIndex) => (
        <div key={rowIndex} className={classes.actionRow}>
          {row.map(({label, keystroke, tooltip, onClick, active, highlightKey}) => (
            <LWTooltip key={label} title={tooltip} placement="left">
              <div
                className={classNames(classes.actionButton, active && 'active', highlightKey && highlightedActions?.has(highlightKey) && classes.highlighted)}
                onClick={onClick}
              >
                <span>{label}</span>
                <KeystrokeDisplay keystroke={keystroke} splitBeforeTranslation activeContext={!!active} />
              </div>
            </LWTooltip>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ModerationActionButtons;
