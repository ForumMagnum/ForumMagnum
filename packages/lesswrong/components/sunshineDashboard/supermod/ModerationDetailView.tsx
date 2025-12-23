import React, { useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationContentList from './ModerationContentList';
import ModerationContentDetail from './ModerationContentDetail';
import type { InboxAction, InboxState } from './inboxReducer';
import ModerationFullWidthHeader from './ModerationFullWidthHeader';
import ModerationSidebar from './ModerationSidebar';
import ModerationUndoHistory from './ModerationUndoHistory';

const styles = defineStyles('ModerationDetailView', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  contentSection: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr 1fr 400px',
  },
  userColumn: {
    borderRight: theme.palette.border.normal,
  },
  contentListColumn: {
    minWidth: 0,
    borderRight: theme.palette.border.normal,
    height: '100vh',
    overflow: 'scroll',
  },
  sidebarColumn: {
    height: '100vh',
    overflow: 'scroll',
  },
}));

const ModerationDetailView = ({ 
  user,
  posts,
  comments,
  focusedContentIndex,
  runningLlmCheckId,
  dispatch,
  state,
}: {
  user: SunshineUsersList;
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  focusedContentIndex: number;
  runningLlmCheckId: string | null;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  state: InboxState;
}) => {
  const classes = useStyles(styles);

  const allContent = useMemo(() => [...posts, ...comments].sort((a, b) => 
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  ), [posts, comments]);

  const focusedContent = useMemo(() => 
    allContent[focusedContentIndex] || null,
    [allContent, focusedContentIndex]
  );

  // #region agent log
  React.useEffect(() => {
    setTimeout(() => {
      const root = document.querySelector('[class*="ModerationDetailView-root"]') as HTMLElement;
      const fullWidthHeader = document.querySelector('[class*="ModerationFullWidthHeader-header"]') as HTMLElement;
      const leftPanel = document.querySelector('[class*="ModerationInbox-leftPanel"]') as HTMLElement;
      const sidebar = document.querySelector('[class*="ModerationInbox-sidebar"]') as HTMLElement;
      fetch('http://127.0.0.1:7245/ingest/aee04c0a-d536-4804-8b9c-ba91f89e023f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ModerationDetailView.tsx:POST-FIX',message:'ModerationDetailView DOM dimensions POST-FIX',data:{rootWidth:root?.offsetWidth,fullWidthHeaderWidth:fullWidthHeader?.offsetWidth,leftPanelWidth:leftPanel?.offsetWidth,sidebarWidth:sidebar?.offsetWidth,windowWidth:window.innerWidth},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1,H2'})}).catch(()=>{});
    }, 100);
  }, [user._id]);
  // #endregion

  return (
    <div className={classes.root}>
      <div className={classes.contentSection}>
        <div className={classes.userColumn}>
          <ModerationFullWidthHeader
            user={user}
            posts={posts}
            comments={comments}
            dispatch={dispatch}
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
          />
          <ModerationUndoHistory
            undoQueue={state.undoQueue}
            history={state.history}
            dispatch={dispatch}
          />
        </div>
      </div>
    </div>
  );
};

export default ModerationDetailView;
