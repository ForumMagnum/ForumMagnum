import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import FormatDate from '@/components/common/FormatDate';
import UsersName from '@/components/users/UsersName';
import ModerationContentList from './ModerationContentList';
import ModerationContentDetail from './ModerationContentDetail';
import type { InboxAction, InboxState } from './inboxReducer';
import ModerationSidebar from './ModerationSidebar';
import ModerationUndoHistory from './ModerationUndoHistory';
import ModerationUserInfoColumn from './ModerationUserInfoColumn';
import { prettyScrollbars } from '@/themes/styleUtils';
import type { SelectedSidebarTab } from './sidebarTabs';
import { getModerationContentItems, getNextUnapprovedContentIndex, isMapPin, type ContentItem } from './helpers';
import ConcurrentModeratorChangeIndicator from './ConcurrentModeratorChangeIndicator';
import ModerationMobileUserActionBar from './ModerationMobileUserActionBar';
import ReviewTriggerBadge from './ReviewTriggerBadge';
import { getDisplayedReasonForGroupAssignment } from './groupings';

const styles = defineStyles('ModerationUserDetailView', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      overflowY: 'auto',
    },
  },
  contentSection: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr 1fr 400px',
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
  mobileUserHeader: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      ...theme.typography.commentStyle,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      padding: '10px 12px',
      fontSize: 13,
      color: theme.palette.grey[600],
      backgroundColor: theme.palette.grey[50],
      borderBottom: theme.palette.border.normal,
    },
  },
  mobileUserName: {
    fontSize: 16,
    fontWeight: 600,
    color: theme.palette.grey[900],
  },
  userColumn: {
    borderRight: theme.palette.border.normal,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)',
    [theme.breakpoints.down('sm')]: {
      order: 1,
      height: 'auto',
      borderRight: 'none',
      borderBottom: theme.palette.border.normal,
    },
  },
  contentListColumn: {
    minWidth: 0,
    borderRight: theme.palette.border.normal,
    height: 'calc(100vh - 64px)',
    ...prettyScrollbars(theme),
    [theme.breakpoints.down('sm')]: {
      height: 'auto',
      borderRight: 'none',
      borderBottom: theme.palette.border.normal,
    },
  },
  sidebarColumn: {
    height: 'calc(100vh - 64px)',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  mobileSidebarOpen: {
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      position: 'fixed',
      top: 'var(--header-height)',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'auto',
      zIndex: 3,
      backgroundColor: theme.palette.background.paper,
    },
  },
  mobileSidebarHeader: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      ...theme.typography.commentStyle,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
      padding: '10px 12px',
      fontSize: 14,
      fontWeight: 600,
      borderBottom: theme.palette.border.normal,
    },
  },
  mobileSidebarClose: {
    color: theme.palette.primary.main,
    cursor: 'pointer',
  },
  mobileActionBar: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'contents',
    },
  },
  // Takes the column height left below the concurrent-change banner
  sidebarBody: {
    flex: 1,
    minHeight: 0,
  },
  // Sits flush against the bottom of the column, taking only the height its
  // contents need, so the rest goes to the user info above it.
  undoQueueColumn: {
    marginTop: 'auto',
    flexShrink: 0,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  }
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
  state,
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
  state: InboxState;
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);
  const [mobileSidebarUserId, setMobileSidebarUserId] = useState<string | null>(null);
  const mobileSidebarOpen = mobileSidebarUserId === user._id;
  const likelyReviewTrigger = getDisplayedReasonForGroupAssignment(user);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0 });
  }, [user._id]);

  const setSidebarTab = useCallback(
    (tab: SelectedSidebarTab) => dispatch({ type: 'SET_SIDEBAR_TAB', tab }),
    [dispatch]
  );

  const allContent = useMemo(
    () => getModerationContentItems(user, posts, comments),
    [user, posts, comments],
  );

  const focusedItem = useMemo(() =>
    allContent[focusedContentIndex] || null,
    [allContent, focusedContentIndex]
  );
  const focusedContent = focusedItem && !isMapPin(focusedItem) ? focusedItem : null;

  const handleContentRejectStart = useCallback((content: ContentItem) => {
    const nextContentIndex = getNextUnapprovedContentIndex(allContent, content._id);
    if (nextContentIndex !== null) {
      dispatch({ type: 'OPEN_CONTENT', contentIndex: nextContentIndex });
    }
  }, [allContent, dispatch]);

  return (
    <div className={classes.root} ref={rootRef}>
      <div className={classes.mobileUserHeader}>
        <span className={classes.mobileUserName}><UsersName user={user} /></span>
        {likelyReviewTrigger && <ReviewTriggerBadge badge={likelyReviewTrigger} />}
        <span>{user.karma} karma</span>
        <FormatDate date={user.createdAt} />
      </div>
      <div className={classes.contentSection}>
        <div className={classes.userColumn}>
          <ModerationUserInfoColumn
            user={user}
            posts={posts}
            comments={comments}
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
          <ModerationContentList
            items={allContent}
            title="Content"
            focusedItemId={allContent[focusedContentIndex]?._id ?? null}
            runningLlmCheckId={runningLlmCheckId}
            dispatch={dispatch}
          />
        </div>
        <div className={classes.contentListColumn}>
          <ModerationContentDetail item={focusedItem} />
        </div>
        <div className={classNames(classes.sidebarColumn, { [classes.mobileSidebarOpen]: mobileSidebarOpen })}>
          <div className={classes.mobileSidebarHeader}>
            <span>All actions</span>
            <span className={classes.mobileSidebarClose} onClick={() => setMobileSidebarUserId(null)}>Close</span>
          </div>
          <ConcurrentModeratorChangeIndicator documentId={user._id} variant="banner" />
          <div className={classes.sidebarBody}>
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
              onContentRejectStart={handleContentRejectStart}
            />
          </div>
        </div>
      </div>
      <div className={classes.mobileActionBar}>
        <ModerationMobileUserActionBar
          user={user}
          currentUser={currentUser}
          undoQueue={state.undoQueue}
          addToUndoQueue={addToUndoQueue}
          dispatch={dispatch}
          onOpenMore={() => setMobileSidebarUserId(user._id)}
        />
      </div>
    </div>
  );
};

export default ModerationUserDetailView;
