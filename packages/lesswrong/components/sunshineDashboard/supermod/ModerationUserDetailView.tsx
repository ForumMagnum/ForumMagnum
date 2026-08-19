import React, { useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationContentList from './ModerationContentList';
import ModerationContentDetail from './ModerationContentDetail';
import type { InboxAction } from './inboxReducer';
import ModerationSidebar from './ModerationSidebar';
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
}));

const ModerationUserDetailView = ({ 
  user,
  posts,
  comments,
  focusedContentIndex,
  runningLlmCheckId,
  sidebarTab,
  addToUndoQueue,
  dispatch,
  currentUser,
}: {
  user: SunshineUsersList;
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  focusedContentIndex: number;
  runningLlmCheckId: string | null;
  sidebarTab: SelectedSidebarTab;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
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
