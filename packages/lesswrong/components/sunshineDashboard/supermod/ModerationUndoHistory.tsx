'use client';

import React, { useEffect, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { UndoHistoryItem, InboxAction, HistoryItem } from './inboxReducer';
import classNames from 'classnames';
import KeystrokeDisplay from './KeystrokeDisplay';
import { UNDO_QUEUE_DURATION } from './constants';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { useMessages } from '@/components/common/withMessages';

const styles = defineStyles('ModerationUndoHistory', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 20,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    borderTop: theme.palette.border.normal,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 8,
    letterSpacing: '0.5px',
  },
  sectionTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  markAllDone: {
    fontSize: 11,
    fontWeight: 400,
    color: theme.palette.grey[500],
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': {
      color: theme.palette.grey[800],
    },
  },
  markAllProgressContainer: {
    height: 2,
    backgroundColor: theme.palette.grey[200],
    marginBottom: 8,
  },
  item: {
    marginBottom: 8,
    borderRadius: 4,
    border: theme.palette.border.faint,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    fontSize: 13,
    overflow: 'hidden',
  },
  undoableItem: {
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
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
  itemContent: {
    padding: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  userName: {
    fontWeight: 600,
    width: 100,
    flexShrink: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actionLabel: {
    color: theme.palette.grey[600],
    fontSize: 12,
  },
  timer: {
    fontSize: 11,
    color: theme.palette.grey[500],
    minWidth: 20,
  },
  historyItem: {
    opacity: 0.6,
  },
  empty: {
    color: theme.palette.grey[500],
    fontSize: 12,
    fontStyle: 'italic',
  },
}));

const ProgressBar = ({ expiresAt, totalDuration }: { expiresAt: number; totalDuration: number }) => {
  const classes = useStyles(styles);
  const now = useCurrentTime();
  const [timeRemaining, setTimeRemaining] = useState(Math.max(0, expiresAt - now.getTime()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeRemaining(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const percentRemaining = Math.max(0, Math.min(100, (timeRemaining / totalDuration) * 100));

  return (
    <div className={classes.progressBarContainer}>
      <div className={classes.progressBar} style={{ width: `${percentRemaining}%` }} />
    </div>
  );
};

const TimeRemaining = ({ expiresAt }: { expiresAt: number }) => {
  const classes = useStyles(styles);
  const now = useCurrentTime();
  const [timeRemaining, setTimeRemaining] = useState(Math.max(0, expiresAt - now.getTime()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeRemaining(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const secondsRemaining = Math.ceil(timeRemaining / 1000);

  return <span className={classes.timer}>{secondsRemaining}s</span>;
};

const ModerationUndoHistory = ({
  undoQueue,
  history,
  dispatch,
}: {
  undoQueue: UndoHistoryItem[];
  history: HistoryItem[];
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  // Non-null while "Mark all done" mutations are in flight
  const [markAllProgress, setMarkAllProgress] = useState<{ done: number; total: number } | null>(null);
  const markAllInFlight = markAllProgress !== null;

  // Warn user if they try to close the tab or navigate away while there are
  // pending actions or in-flight "Mark all done" mutations (unloading aborts
  // in-flight requests, so leaving early would silently drop actions)
  useEffect(() => {
    if (undoQueue.length === 0 && !markAllInFlight) return;

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
  }, [undoQueue.length, markAllInFlight]);

  const handleUndo = (userId: string) => {
    dispatch({ type: 'UNDO_ACTION', userId });
  };

  const handleMarkAllDone = async () => {
    if (markAllInFlight) return;
    // Skip items whose expiration timeout may have already fired (our undoQueue
    // prop could be one render stale), so their action doesn't run twice
    const items = undoQueue.filter(item => item.expiresAt > Date.now());
    if (items.length === 0) return;

    for (const item of items) {
      // Cancel the pending expiration timeout so the action doesn't run twice
      clearTimeout(item.timeoutId);
      dispatch({ type: 'EXPIRE_UNDO_ITEM', userId: item.user._id });
    }

    setMarkAllProgress({ done: 0, total: items.length });
    const results = await Promise.allSettled(items.map(async (item) => {
      await item.executeAction();
      setMarkAllProgress(prev => prev && { ...prev, done: prev.done + 1 });
    }));
    setMarkAllProgress(null);

    const failedNames = items
      .filter((_, i) => results[i].status === 'rejected')
      .map(item => item.user.displayName);
    if (failedNames.length > 0) {
      flash({ messageString: `Failed to execute action for: ${failedNames.join(', ')}` });
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.section}>
        <div className={classes.sectionTitleRow}>
          <div className={classes.sectionTitle}>Undo Queue</div>
          {undoQueue.length > 0 && (
            <div className={classes.markAllDone} onClick={handleMarkAllDone}>
              Mark all done
            </div>
          )}
        </div>
        {markAllProgress && (
          <div className={classes.markAllProgressContainer}>
            <div
              className={classes.progressBar}
              style={{ width: `${(markAllProgress.done / markAllProgress.total) * 100}%` }}
            />
          </div>
        )}
        {undoQueue.length === 0 ? (
          <div className={classes.empty}>No pending actions</div>
        ) : (
          [...undoQueue].reverse().map((item, index) => (
            <div 
              key={item.user._id} 
              className={classNames(classes.item, classes.undoableItem)}
              onClick={() => handleUndo(item.user._id)}
            >
              <ProgressBar expiresAt={item.expiresAt} totalDuration={UNDO_QUEUE_DURATION} />
              <div className={classes.itemContent}>
                <div className={classes.itemLeft}>
                  <span className={classes.userName}>{item.user.displayName}</span>
                  <span className={classes.actionLabel}>{item.actionLabel}</span>
                </div>
                <div className={classes.itemRight}>
                  <TimeRemaining expiresAt={item.expiresAt} />
                  {index === 0 && <KeystrokeDisplay keystroke="Ctrl+Z" />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={classes.section}>
        <div className={classes.sectionTitle}>History</div>
        {history.length === 0 ? (
          <div className={classes.empty}>No history</div>
        ) : (
          history.slice(-5).reverse().map((item) => (
            <div key={`${item.user._id}-${item.timestamp}`} className={classNames(classes.item, classes.historyItem)}>
              <div className={classes.itemContent}>
                <div className={classes.itemLeft}>
                  <span className={classes.userName}>{item.user.displayName}</span>
                  <span className={classes.actionLabel}>{item.actionLabel}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ModerationUndoHistory;

