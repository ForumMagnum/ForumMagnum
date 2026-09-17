import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationUserContentItem from './ModerationUserContentItem';
import type { InboxAction } from './inboxReducer';
import { isMapPin, type ModerationContentItem } from './helpers';
import { ModerationMapPinListItem } from './ModerationMapPin';
import type { TabId } from './groupings';
import { getReviewGroupDisplayName } from '@/lib/collections/users/reviewGroups';

const styles = defineStyles('ModerationContentList', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    borderRight: theme.palette.border.normal,
    overflowY: 'auto',
    height: 'fit-content',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    padding: '12px 20px',
    borderBottom: theme.palette.border.normal,
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: 1,
  },
  title: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
  },
  queues: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: theme.palette.grey[600],
  },
  queue: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    fontWeight: 500,
    color: theme.palette.grey[800],
    padding: '2px 6px',
    borderRadius: 4,
    backgroundColor: theme.palette.greyAlpha(0.1),
    '&[data-queue="newContent"]': {
      backgroundColor: theme.palette.panelBackground.sunshineNewPosts,
    },
    '&[data-queue="maybeSpam"], &[data-queue="offboard"]': {
      backgroundColor: theme.palette.panelBackground.sunshineWarningHighlight,
    },
    '&[data-queue="highContext"], &[data-queue="automod"], &[data-queue="snoozeExpired"]': {
      backgroundColor: theme.palette.panelBackground.sunshineNewComments,
    },
  },
  count: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginLeft: 4,
  },
  list: {
    // No padding - items will have their own spacing
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
}));

const ModerationContentList = ({
  items,
  title,
  activeTab,
  reviewGroup,
  focusedItemId,
  runningLlmCheckId,
  dispatch,
}: {
  items: ModerationContentItem[];
  title: string;
  activeTab: TabId;
  reviewGroup: ReviewGroup;
  focusedItemId: string | null;
  runningLlmCheckId: string | null;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <span className={classes.title}>
          {title}
          <span className={classes.count}>({items.length})</span>
        </span>
        <span className={classes.queues}>
          {activeTab === 'all' && <>
            <span className={classes.queue} data-queue={reviewGroup} title="User review group">{getReviewGroupDisplayName(reviewGroup)}</span>
            ⊂
          </>}
          <span className={classes.queue} data-queue={activeTab} title="Current queue">{getReviewGroupDisplayName(activeTab)}</span>
        </span>
      </div>
      {items.length === 0 ? (
        <div className={classes.empty}>
          No {title.toLowerCase()}
        </div>
      ) : (
        <div className={classes.list}>
          {items.map((item, idx) => (
            isMapPin(item)
              ? <ModerationMapPinListItem
                key={item._id}
                item={item}
                isFocused={item._id === focusedItemId}
                onOpen={() => dispatch({ type: 'OPEN_CONTENT', contentIndex: idx })}
              />
              : <ModerationUserContentItem
                key={item._id}
                item={item}
                isFocused={item._id === focusedItemId}
                isRunningLlmCheck={item._id === runningLlmCheckId}
                onOpen={() => dispatch({ type: 'OPEN_CONTENT', contentIndex: idx })}
                onReject={() => dispatch({ type: 'OPEN_CONTENT', contentIndex: idx, sidebarTab: 'reject' })}
                dispatch={dispatch}
              />
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerationContentList;
