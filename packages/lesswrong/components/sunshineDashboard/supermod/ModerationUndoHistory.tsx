'use client';

import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { HistoryItem } from './inboxReducer';
import classNames from 'classnames';

const styles = defineStyles('ModerationUndoHistory', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    borderTop: theme.palette.border.normal,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 8,
    letterSpacing: '0.5px',
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
  historyItem: {
    opacity: 0.6,
  },
  loadMore: {
    fontSize: 12,
    color: theme.palette.grey[500],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    },
  },
}));

const HISTORY_PAGE_SIZE = 2;

/**
 * Moderation actions whose undo window has already elapsed. Pending actions
 * live in ModerationUndoToast instead, which floats over the page rather than
 * taking up column space.
 */
const ModerationUndoHistory = ({ history }: {
  history: HistoryItem[];
}) => {
  const classes = useStyles(styles);
  const [historyLimit, setHistoryLimit] = useState(HISTORY_PAGE_SIZE);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className={classes.root}>
      <div className={classes.sectionTitle}>History</div>
      {history.slice(-historyLimit).reverse().map((item) => (
        <div key={`${item.user._id}-${item.timestamp}`} className={classNames(classes.item, classes.historyItem)}>
          <div className={classes.itemContent}>
            <div className={classes.itemLeft}>
              <span className={classes.userName}>{item.user.displayName}</span>
              <span className={classes.actionLabel}>{item.actionLabel}</span>
            </div>
          </div>
        </div>
      ))}
      {history.length > historyLimit && (
        <div className={classes.loadMore} onClick={() => setHistoryLimit(historyLimit + HISTORY_PAGE_SIZE)}>
          Load more
        </div>
      )}
    </div>
  );
};

export default ModerationUndoHistory;
