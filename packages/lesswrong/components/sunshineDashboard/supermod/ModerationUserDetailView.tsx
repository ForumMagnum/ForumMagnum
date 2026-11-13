import React, { useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationUserFeed from './ModerationUserFeed';
import type { InboxAction, InboxState } from './inboxReducer';
import ModerationSidebar from './ModerationSidebar';
import ModerationUndoHistory from './ModerationUndoHistory';
import ModerationUserInfoColumn from './ModerationUserInfoColumn';
import { prettyScrollbars } from '@/themes/styleUtils';
import type { SelectedSidebarTab } from './sidebarTabs';
import { getModerationContentItems, getNextUnapprovedContentIndex, isMapPin, type ContentItem } from './helpers';
import ConcurrentModeratorChangeIndicator from './ConcurrentModeratorChangeIndicator';

const styles = defineStyles('ModerationUserDetailView', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  contentSection: {
    display: 'grid',
    gridTemplateColumns: '470px 1fr 440px',
  },
  userColumn: {
    borderRight: theme.palette.border.normal,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)',
  },
  contentListColumn: {
    minWidth: 0,
    borderRight: theme.palette.border.normal,
    height: 'calc(100vh - 64px)',
    ...prettyScrollbars(theme),
  },
  sidebarColumn: {
    height: 'calc(100vh - 64px)',
    ...prettyScrollbars(theme),
  },
  // Sits flush against the bottom of the column, taking only the height its
  // contents need, so the rest goes to the user info above it.
  undoQueueColumn: {
    marginTop: 'auto',
    flexShrink: 0,
  }
}));

const ModerationUserDetailView = ({ 
  user,
  posts,
  comments,
  contentsLoading,
  focusedContentIndex,
  runningLlmCheckId,
  sidebarTab,
  addToUndoQueue,
  dispatch,
  state,
  currentUser,
}: {
  user: SunshineUsersList;
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  contentsLoading: boolean;
  focusedContentIndex: number;
  runningLlmCheckId: string | null;
  sidebarTab: SelectedSidebarTab;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  state: InboxState;
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);

  const allContent = useMemo(
    () => getModerationContentItems(user, posts, comments),
    [user, posts, comments],
  );
  const focusedItem = allContent[focusedContentIndex];
  const focusedContent = focusedItem && !isMapPin(focusedItem) ? focusedItem : null;

  const setSidebarTab = useCallback(
    (tab: SelectedSidebarTab) => dispatch({ type: 'SET_SIDEBAR_TAB', tab }),
    [dispatch]
  );

  const handleContentRejectStart = useCallback((content: ContentItem) => {
    const nextContentIndex = getNextUnapprovedContentIndex(allContent, content._id);
    if (nextContentIndex !== null) {
      dispatch({ type: 'OPEN_CONTENT', contentIndex: nextContentIndex });
    }
  }, [allContent, dispatch]);

  return (
    <div className={classes.root}>
      <div className={classes.contentSection}>
        <div className={classes.userColumn}>
          <ConcurrentModeratorChangeIndicator documentId={user._id} variant="banner" />
          <ModerationUserInfoColumn
            user={user}
            items={allContent}
            currentUser={currentUser}
            dispatch={dispatch}
          />
          <div className={classes.undoQueueColumn}>
            <ModerationUndoHistory
              undoQueue={state.undoQueue}
              dispatch={dispatch}
            />
          </div>
        </div>
        <div className={classes.contentListColumn}>
          <ModerationUserFeed
            key={user._id}
            user={user}
            items={allContent}
            focusedItemId={focusedItem?._id ?? null}
            runningLlmCheckId={runningLlmCheckId}
            dispatch={dispatch}
          />
        </div>
        <div className={classes.sidebarColumn}>
          <ModerationSidebar
            user={user}
            currentUser={currentUser}
            posts={posts}
            comments={comments}
            contentsLoading={contentsLoading}
            focusedContent={focusedContent}
            sidebarTab={sidebarTab}
            rejectComposerFocusToken={state.rejectComposerFocusToken ?? 0}
            setSidebarTab={setSidebarTab}
            addToUndoQueue={addToUndoQueue}
            dispatch={dispatch}
            onContentRejectStart={handleContentRejectStart}
          />
        </div>
      </div>
    </div>
  );
};

export default ModerationUserDetailView;
