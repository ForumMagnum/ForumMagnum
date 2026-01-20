import React, { useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationContentList from './ModerationContentList';
import ModerationContentDetail from './ModerationContentDetail';
import type { InboxAction, InboxState } from './inboxReducer';
import ModerationSidebar from './ModerationSidebar';
import ModerationUndoHistory from './ModerationUndoHistory';
import ModerationUserInfoColumn from './ModerationUserInfoColumn';
import { prettyScrollbars } from '@/themes/styleUtils';

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
    display: 'flex',
    flexDirection: 'column',
  },
  contentListColumn: {
    minWidth: 0,
    borderRight: theme.palette.border.normal,
    height: 'calc(100vh - 64px)',
    ...prettyScrollbars,
  },
  sidebarColumn: {
    height: 'calc(100vh - 64px)',
    ...prettyScrollbars,
  },
  undoQueueColumn: {
    marginTop: 'auto',
    marginBottom: 50
  }
}));

const ModerationDetailView = ({ 
  user,
  posts,
  comments,
  focusedContentIndex,
  runningLlmCheckId,
  dispatch,
  state,
  currentUser,
}: {
  user: SunshineUsersList;
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  focusedContentIndex: number;
  runningLlmCheckId: string | null;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
  state: InboxState;
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);

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
            dispatch={dispatch}
          />
        </div>
      </div>
    </div>
  );
};

export default ModerationDetailView;
