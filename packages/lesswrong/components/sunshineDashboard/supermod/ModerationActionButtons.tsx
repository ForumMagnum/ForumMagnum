import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWTooltip from '@/components/common/LWTooltip';
import KeystrokeDisplay from './KeystrokeDisplay';
import { useModerationUserActions } from './useModerationUserActions';

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
  },
}));

const ModerationActionButtons = ({user, currentUser, addToUndoQueue}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
}) => {
  const classes = useStyles(styles);

  const {
    handleReview,
    handleApproveCurrentOnly,
    handleSnooze,
    handleSnoozeCustom,
    handleRejectContentAndRemove,
    handleRestrictAndNotify,
    handlePurge,
  } = useModerationUserActions({ selectedUser: user, currentUser, addToUndoQueue });

  const moderatorActionRows = [
    [
      {
        label: 'Approve',
        keystroke: 'A',
        tooltip: "Approve this user and all their content. Marks them as reviewed by you, so their future posts and comments no longer need review. Clears any snooze and any flag, and signs an 'Approved' note in their moderator notes.",
        onClick: handleReview,
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
      },
      {
        label: 'Approve Current Only',
        keystroke: 'Shift+A',
        tooltip: "Approve this user's existing unreviewed posts and comments and remove them from the queue, without marking the user as reviewed, so their future content will still need review. Also clears any snooze and any flag.",
        onClick: handleApproveCurrentOnly,
      },
    ],
    [
      {
        label: 'Reject Latest & Remove',
        keystroke: 'X',
        tooltip: "Opens the rejection-reason dialog, then rejects this user's most recent unapproved post or comment with that reason, and removes the user from the review queue (without approving them).",
        onClick: handleRejectContentAndRemove,
      },
      {
        label: 'Reject, Restrict & Notify',
        keystroke: 'Shift+R',
        tooltip: "Opens the rejection-reason dialog, then a message dialog. Rejects this user's most recent unapproved post or comment, disables their posting, commenting, messaging, and voting, sends them the message as a moderator PM, and removes them from the review queue.",
        onClick: handleRestrictAndNotify,
      },
    ],
    [
      {
        label: 'Purge',
        keystroke: 'P',
        tooltip: "Deletes all of this user's posts, comments, sequences, and votes, bans them for 1000 years, and removes them from the review queue. Asks for confirmation first, and signs a 'Purge' note in their moderator notes.",
        onClick: handlePurge,
      },
    ],
  ];

  return (
    <div className={classes.actionsColumn}>
      {moderatorActionRows.map((row, rowIndex) => (
        <div key={rowIndex} className={classes.actionRow}>
          {row.map(({label, keystroke, tooltip, onClick}) => (
            <LWTooltip key={label} title={tooltip} placement="left">
              <div className={classes.actionButton} onClick={onClick}>
                <span>{label}</span>
                <KeystrokeDisplay keystroke={keystroke} splitBeforeTranslation />
              </div>
            </LWTooltip>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ModerationActionButtons;
