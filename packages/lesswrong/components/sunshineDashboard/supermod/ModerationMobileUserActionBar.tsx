import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import { useModerationUserActions } from './useModerationUserActions';
import { TimeRemaining } from './ModerationUndoHistory';
import type { InboxAction, UndoHistoryItem } from './inboxReducer';

const styles = defineStyles('ModerationMobileUserActionBar', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    position: 'sticky',
    bottom: 0,
    zIndex: 2,
    marginTop: 'auto',
    backgroundColor: theme.palette.background.paper,
    borderTop: theme.palette.border.normal,
    boxShadow: `0 -2px 6px ${theme.palette.boxShadowColor(0.08)}`,
  },
  undoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    fontSize: 13,
    borderBottom: theme.palette.border.faint,
    backgroundColor: theme.palette.grey[100],
  },
  undoLabel: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  undoUserName: {
    fontWeight: 600,
    marginRight: 6,
  },
  undoButton: {
    fontWeight: 600,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  buttons: {
    display: 'flex',
    gap: 8,
    padding: '8px 12px',
  },
  button: {
    flex: 1,
    padding: '10px 4px',
    borderRadius: 4,
    border: theme.palette.border.normal,
    backgroundColor: theme.palette.background.paper,
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'center',
    cursor: 'pointer',
    color: theme.palette.grey[900],
  },
  approveButton: {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
  },
  rejectButton: {
    color: theme.palette.error.main,
  },
}));

const ModerationMobileUserActionBar = ({ user, currentUser, undoQueue, addToUndoQueue, dispatch, onOpenMore }: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  undoQueue: UndoHistoryItem[];
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  onOpenMore: () => void;
}) => {
  const classes = useStyles(styles);
  const { handleReview, handleSnoozeChoice, handleRejectContentAndRemove } = useModerationUserActions({ selectedUser: user, currentUser, addToUndoQueue, dispatch });
  const latestUndoItem = undoQueue.at(-1);

  return (
    <div className={classes.root}>
      {latestUndoItem && (
        <div className={classes.undoRow}>
          <span className={classes.undoLabel}>
            <span className={classes.undoUserName}>{latestUndoItem.user.displayName}</span>
            {latestUndoItem.actionLabel}
          </span>
          <TimeRemaining expiresAt={latestUndoItem.expiresAt} />
          <span className={classes.undoButton} onClick={() => dispatch({ type: 'UNDO_ACTION', userId: latestUndoItem.user._id })}>
            Undo
          </span>
        </div>
      )}
      <div className={classes.buttons}>
        <div className={classNames(classes.button, classes.approveButton)} onClick={handleReview}>Approve</div>
        <div className={classes.button} onClick={handleSnoozeChoice}>Snooze</div>
        <div className={classNames(classes.button, classes.rejectButton)} onClick={handleRejectContentAndRemove}>Reject</div>
        <div className={classes.button} onClick={onOpenMore}>More</div>
      </div>
    </div>
  );
};

export default ModerationMobileUserActionBar;
