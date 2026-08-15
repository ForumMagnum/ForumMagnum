'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { UndoHistoryItem, InboxAction } from './inboxReducer';
import KeystrokeDisplay from './KeystrokeDisplay';
import { UNDO_QUEUE_DURATION } from './constants';
import { useCurrentTime } from '@/lib/utils/timeUtil';

const styles = defineStyles('ModerationUndoToast', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: theme.zIndexes.snackbar,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: 360,
    maxWidth: 'calc(100vw - 48px)',
  },
  toast: {
    borderRadius: 4,
    border: theme.palette.border.faint,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    boxShadow: `0 2px 12px ${theme.palette.boxShadowColor(0.2)}`,
    fontSize: 13,
    overflow: 'hidden',
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: theme.palette.grey[200],
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.palette.primary.main,
    transition: 'width 0.1s linear',
  },
  toastContent: {
    padding: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  toastLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  toastRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  actionLabel: {
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  userName: {
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  undoButton: {
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: '0.5px',
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.8,
    },
  },
  timer: {
    fontSize: 11,
    color: theme.palette.grey[500],
    minWidth: 22,
    textAlign: 'right',
  },
  markAllDone: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: theme.palette.grey[500],
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': {
      color: theme.palette.grey[800],
    },
  },
}));

const COUNTDOWN_TICK_INTERVAL = 100;

/**
 * Milliseconds left before `expiresAt`, re-rendering on a fixed tick. Seeded
 * from `useCurrentTime` so the first render is isomorphic between server and
 * client.
 */
function useTimeRemaining(expiresAt: number): number {
  const now = useCurrentTime();
  const [timeRemaining, setTimeRemaining] = useState(Math.max(0, expiresAt - now.getTime()));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(Math.max(0, expiresAt - Date.now()));
    }, COUNTDOWN_TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return timeRemaining;
}

/**
 * Commits every queued action immediately, cancelling the pending expiration
 * timeouts first so nothing runs twice.
 */
function commitAllPendingActions(undoQueue: UndoHistoryItem[], dispatch: React.Dispatch<InboxAction>) {
  for (const item of undoQueue) {
    clearTimeout(item.timeoutId);
    dispatch({ type: 'EXPIRE_UNDO_ITEM', userId: item.user._id });
    void item.executeAction();
  }
}

const ModerationUndoToastItem = ({ item, showKeystroke, dispatch }: {
  item: UndoHistoryItem;
  showKeystroke: boolean;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);
  const timeRemaining = useTimeRemaining(item.expiresAt);

  const handleUndo = useCallback(
    () => dispatch({ type: 'UNDO_ACTION', userId: item.user._id }),
    [dispatch, item.user._id]
  );

  const percentRemaining = Math.max(0, Math.min(100, (timeRemaining / UNDO_QUEUE_DURATION) * 100));
  const secondsRemaining = Math.ceil(timeRemaining / 1000);

  return (
    <div className={classes.toast}>
      <div className={classes.progressBarContainer}>
        <div className={classes.progressBar} style={{ width: `${percentRemaining}%` }} />
      </div>
      <div className={classes.toastContent}>
        <div className={classes.toastLeft}>
          <span className={classes.actionLabel}>{item.actionLabel}</span>
          <span className={classes.userName}>{item.user.displayName}</span>
        </div>
        <div className={classes.toastRight}>
          <span className={classes.undoButton} onClick={handleUndo}>Undo</span>
          {showKeystroke && <KeystrokeDisplay keystroke="Ctrl+Z" />}
          <span className={classes.timer}>{secondsRemaining}s</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Floating undo affordance for pending moderation actions. This is
 * fixed-position, so it must be mounted exactly once, at the top level of the
 * moderation inbox, rather than per-view.
 */
const ModerationUndoToast = ({ undoQueue, dispatch }: {
  undoQueue: UndoHistoryItem[];
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);

  // Warn the user if they try to close the tab or navigate away while there are
  // pending actions
  useEffect(() => {
    if (undoQueue.length === 0) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers may still be relying on returnValue to be set
      // https://developer.mozilla.org/en-US/docs/Web/API/BeforeUnloadEvent/returnValue
      event.returnValue = 'Pending undo queue entries!';
      return 'Pending undo queue entries!';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [undoQueue.length]);

  const handleMarkAllDone = useCallback(
    () => commitAllPendingActions(undoQueue, dispatch),
    [undoQueue, dispatch]
  );

  if (undoQueue.length === 0) {
    return null;
  }

  // Rendered oldest-first, so the most recent action (the one Ctrl+Z undoes)
  // sits nearest the bottom-right corner.
  const mostRecentItem = undoQueue[undoQueue.length - 1];

  return (
    <div className={classes.root}>
      {undoQueue.length > 1 && (
        <div className={classes.markAllDone} onClick={handleMarkAllDone}>
          Mark all done
        </div>
      )}
      {undoQueue.map((item) => (
        <ModerationUndoToastItem
          key={item.user._id}
          item={item}
          showKeystroke={item.user._id === mostRecentItem.user._id}
          dispatch={dispatch}
        />
      ))}
    </div>
  );
};

export default ModerationUndoToast;
