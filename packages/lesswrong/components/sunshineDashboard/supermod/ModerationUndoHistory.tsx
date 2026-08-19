'use client';

import React, { useEffect, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { UndoHistoryItem, InboxAction, HistoryItem } from './inboxReducer';
import classNames from 'classnames';
import KeystrokeDisplay from './KeystrokeDisplay';
import { UNDO_QUEUE_DURATION } from './constants';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { useMessages } from '@/components/common/withMessages';
import { runQueuedModerationAction, runQueuedModerationActions } from './runQueuedModerationAction';

const styles = defineStyles('ModerationUndoHistory', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    borderTop: theme.palette.border.normal,
  },
  section: {
    marginBottom: 16,
    '&:last-child': {
      marginBottom: 0,
    },
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
  item: {
    marginBottom: 8,
    '&:last-child': {
      marginBottom: 0,
    },
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
  loadMore: {
    fontSize: 12,
    color: theme.palette.grey[500],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    },
  },
  failedSectionTitle: {
    color: theme.palette.error.main,
  },
  failedItem: {
    border: `2px solid ${theme.palette.error.main}`,
  },
  errorMessage: {
    padding: '0 8px 8px 8px',
    fontSize: 11,
    color: theme.palette.error.main,
    wordBreak: 'break-word',
  },
  failedItemButton: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    cursor: 'pointer',
    color: theme.palette.error.main,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  dismissButton: {
    color: theme.palette.grey[500],
    '&:hover': {
      color: theme.palette.grey[800],
    },
  },
}));

const HISTORY_PAGE_SIZE = 2;

function getHistoryItemKey(item: HistoryItem) {
  return `${item.user._id}-${item.timestamp}`;
}

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
  const [historyLimit, setHistoryLimit] = useState(HISTORY_PAGE_SIZE);
  const [retryingKeys, setRetryingKeys] = useState<string[]>([]);

  const failedActions = history.filter(item => item.error);
  const completedActions = history.filter(item => !item.error);

  // Warn user if they try to close the tab or navigate away while there are pending
  // actions, or actions that failed to save and haven't been retried or dismissed
  useEffect(() => {
    if (undoQueue.length === 0 && failedActions.length === 0) return;

    const warning = failedActions.length > 0
      ? 'Some moderation actions failed to save!'
      : 'Pending undo queue entries!';

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers may still be relying on returnValue to be set
      // https://developer.mozilla.org/en-US/docs/Web/API/BeforeUnloadEvent/returnValue
      event.returnValue = warning;
      return warning;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [undoQueue.length, failedActions.length]);

  const handleUndo = (userId: string) => {
    dispatch({ type: 'UNDO_ACTION', userId });
  };

  const handleMarkAllDone = () => {
    const itemsToRun = [...undoQueue];
    for (const item of itemsToRun) {
      // Cancel the pending expiration timeout so the action doesn't run twice
      clearTimeout(item.timeoutId);
      dispatch({ type: 'EXPIRE_UNDO_ITEM', userId: item.user._id });
    }
    // Runs after the items are in history, so failures can be marked there
    void runQueuedModerationActions(itemsToRun, dispatch, flash);
  };

  const handleRetry = async (item: HistoryItem) => {
    const itemKey = getHistoryItemKey(item);
    if (retryingKeys.includes(itemKey)) return;

    setRetryingKeys(keys => [...keys, itemKey]);
    const succeeded = await runQueuedModerationAction(item, dispatch, flash);
    setRetryingKeys(keys => keys.filter(key => key !== itemKey));

    if (succeeded) {
      flash({ messageString: `Saved: ${item.actionLabel} for ${item.user.displayName}` });
    }
  };

  const handleDismissFailure = (item: HistoryItem) => {
    dispatch({ type: 'DISMISS_FAILED_ACTION', userId: item.user._id, timestamp: item.timestamp });
  };

  return (
    <div className={classes.root}>
      {failedActions.length > 0 && (
        <div className={classes.section}>
          <div className={classNames(classes.sectionTitle, classes.failedSectionTitle)}>
            {failedActions.length} action{failedActions.length === 1 ? '' : 's'} failed to save
          </div>
          {[...failedActions].reverse().map((item) => {
            const itemKey = getHistoryItemKey(item);
            return (
              <div key={itemKey} className={classNames(classes.item, classes.failedItem)}>
                <div className={classes.itemContent}>
                  <div className={classes.itemLeft}>
                    <span className={classes.userName}>{item.user.displayName}</span>
                    <span className={classes.actionLabel}>{item.actionLabel}</span>
                  </div>
                  <div className={classes.itemRight}>
                    <span className={classes.failedItemButton} onClick={() => handleRetry(item)}>
                      {retryingKeys.includes(itemKey) ? 'Retrying' : 'Retry'}
                    </span>
                    <span
                      className={classNames(classes.failedItemButton, classes.dismissButton)}
                      onClick={() => handleDismissFailure(item)}
                    >
                      Dismiss
                    </span>
                  </div>
                </div>
                <div className={classes.errorMessage}>{item.error}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className={classes.section}>
        <div className={classes.sectionTitleRow}>
          <div className={classes.sectionTitle}>Undo Queue</div>
          {undoQueue.length > 0 && (
            <div className={classes.markAllDone} onClick={handleMarkAllDone}>
              Mark all done
            </div>
          )}
        </div>
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
        {completedActions.length === 0 ? (
          <div className={classes.empty}>No history</div>
        ) : (
          <>
            {completedActions.slice(-historyLimit).reverse().map((item) => (
              <div key={getHistoryItemKey(item)} className={classNames(classes.item, classes.historyItem)}>
                <div className={classes.itemContent}>
                  <div className={classes.itemLeft}>
                    <span className={classes.userName}>{item.user.displayName}</span>
                    <span className={classes.actionLabel}>{item.actionLabel}</span>
                  </div>
                </div>
              </div>
            ))}
            {completedActions.length > historyLimit && (
              <div className={classes.loadMore} onClick={() => setHistoryLimit(historyLimit + HISTORY_PAGE_SIZE)}>
                Load more
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ModerationUndoHistory;

