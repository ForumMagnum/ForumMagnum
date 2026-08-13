import React, { useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationContentList from './ModerationContentList';
import ModerationContentDetail from './ModerationContentDetail';
import type { InboxAction, InboxState } from './inboxReducer';
import ModerationSidebar from './ModerationSidebar';
import ModerationUndoHistory from './ModerationUndoHistory';
import ModerationUserInfoColumn from './ModerationUserInfoColumn';
import { prettyScrollbars } from '@/themes/styleUtils';
import type { SelectedSidebarTab } from './sidebarTabs';

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
    gridTemplateColumns: '300px 1fr 1fr 400px',
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

  const setSidebarTab = useCallback(
    (tab: SelectedSidebarTab) => dispatch({ type: 'SET_SIDEBAR_TAB', tab }),
    [dispatch]
  );

  const allContent = useMemo(() => [...posts, ...comments].sort((a, b) =>
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  ), [posts, comments]);

  const focusedContent = useMemo(() => 
    allContent[focusedContentIndex] || null,
    [allContent, focusedContentIndex]
  );

  return (
    <div className={classes.root}>
      <div className={classes.contentSection}>
        <div className={classes.userColumn}>
          <ModerationUserInfoColumn
            user={user}
            posts={posts}
            comments={comments}
            currentUser={currentUser}
          />
          <div className={classes.undoQueueColumn}>
            <ModerationUndoHistory
              undoQueue={state.undoQueue}
              history={state.history}
              dispatch={dispatch}
            />
          </div>
        </div>
        <div className={classes.contentListColumn}>
          <ModerationContentList
            items={allContent}
            title="Posts & Comments"
            focusedItemId={allContent[focusedContentIndex]?._id ?? null}
            runningLlmCheckId={runningLlmCheckId}
            dispatch={dispatch}
          />
        </div>
        <div className={classes.contentListColumn}>
          <ModerationContentDetail item={focusedContent} />
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
            setSidebarTab={setSidebarTab}
            addToUndoQueue={addToUndoQueue}
            dispatch={dispatch}
          />
        </div>
      </div>
    </div>
  );
};

export default ModerationUserDetailView;
