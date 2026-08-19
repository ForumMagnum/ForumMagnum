'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { UndoHistoryItem, InboxAction } from './inboxReducer';
import { getEnvKeystrokeText } from '@/lib/vendor/ckeditor5-util/keyboard';
import { UNDO_QUEUE_DURATION } from './constants';
import { useCurrentTime } from '@/lib/utils/timeUtil';

const styles = defineStyles('ModerationUndoToast', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    position: 'fixed',
    bottom: 12,
    left: 12,
    zIndex: theme.zIndexes.snackbar,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 3,
    maxWidth: 'calc(100vw - 24px)',
  },
  // Each pill is sized by its contents rather than by the stack, so a queue of
  // them stays as narrow as its labels allow.
  pill: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    padding: '2px 8px 3px',
    borderRadius: 10,
    border: theme.palette.border.faint,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    boxShadow: `0 1px 4px ${theme.palette.boxShadowColor(0.15)}`,
    fontSize: 11,
    lineHeight: '15px',
    overflow: 'hidden',
  },
  // Hugs the bottom edge of the pill, clipped to its rounded corners, so time
  // remaining costs no vertical space.
  progressBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 2,
    backgroundColor: theme.palette.primary.main,
    transition: 'width 0.1s linear',
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
    flexShrink: 0,
    marginLeft: 2,
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: '0.3px',
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.8,
    },
  },
  keystrokeHint: {
    flexShrink: 0,
    fontSize: 10,
    color: theme.palette.grey[500],
    whiteSpace: 'nowrap',
  },
  // Carries the pill's background so it stays legible over whatever page
  // content happens to sit behind the stack.
  markAllDone: {
    padding: '1px 8px 2px',
    borderRadius: 10,
    border: theme.palette.border.faint,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    boxShadow: `0 1px 4px ${theme.palette.boxShadowColor(0.15)}`,
    fontSize: 10,
    lineHeight: '13px',
    color: theme.palette.grey[600],
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
}));

const COUNTDOWN_TICK_INTERVAL = 100;

const UNDO_KEYSTROKE_TEXT = getEnvKeystrokeText('Ctrl+Z');

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

  return (
    <div className={classes.pill}>
      <span className={classes.actionLabel}>{item.actionLabel}</span>
      <span className={classes.userName}>{item.user.displayName}</span>
      <span className={classes.undoButton} onClick={handleUndo}>Undo</span>
      {showKeystroke && <span className={classes.keystrokeHint}>{UNDO_KEYSTROKE_TEXT}</span>}
      <div className={classes.progressBar} style={{ width: `${percentRemaining}%` }} />
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

  return (
    <div className={classes.root}>
      {undoQueue.length > 1 && (
        <div className={classes.markAllDone} onClick={handleMarkAllDone}>
          Mark all done
        </div>
      )}
      {/*
        Rendered oldest-first, so the most recent action (the one Ctrl+Z undoes)
        sits nearest the bottom-left corner. Keyed and flagged by position
        rather than by user, because rapid-fire keystrokes can enqueue the same
        user more than once.
      */}
      {undoQueue.map((item, index) => (
        <ModerationUndoToastItem
          key={`${item.user._id}-${item.timestamp}`}
          item={item}
          showKeystroke={index === undoQueue.length - 1}
          dispatch={dispatch}
        />
      ))}
    </div>
  );
};

export default ModerationUndoToast;
