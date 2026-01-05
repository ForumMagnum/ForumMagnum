'use client';

import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCurrentUser } from '@/components/common/withUser';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import ModerationInboxList, { GroupEntry } from './ModerationInboxList';
import ModerationDetailView from './ModerationDetailView';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import ModerationUserKeyboardHandler from './ModerationUserKeyboardHandler';
import ModerationPostKeyboardHandler from './ModerationPostKeyboardHandler';
import Loading from '@/components/vulcan-core/Loading';
import groupBy from 'lodash/groupBy';
import { getUserReviewGroup, REVIEW_GROUP_TO_PRIORITY, type ReviewGroup } from './groupings';
import { getFilteredGroups, getVisibleTabsInOrder, InboxState, inboxStateReducer } from './inboxReducer';
import type { TabInfo } from './ModerationTabs';
import { UNDO_QUEUE_DURATION } from './constants';
import { useHydrateModerationPostCache } from '@/components/hooks/useHydrateModerationPostCache';
import { useCoreTags } from '@/components/tagging/useCoreTags';
import { CoreTagsKeyboardProvider } from '@/components/tagging/CoreTagsKeyboardContext';

const SunshineUsersListMultiQuery = gql(`
  query multiUserModerationInboxQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshineUsersList
      }
      totalCount
    }
  }
`);

const SunshinePostsListMultiQuery = gql(`
  query multiPostModerationInboxQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshinePostsList
      }
      totalCount
    }
  }
`);

const styles = defineStyles('ModerationInbox', (theme: ThemeType) => ({
  root: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    overflow: 'hidden',
    position: 'fixed',
    marginTop: -50,
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0,
  },
  leftPanel: {
    flex: 1,
    overflow: 'hidden',
    borderRight: theme.palette.border.normal,
  },
  sidebar: {
    width: 400,
    overflow: 'hidden',
    borderLeft: theme.palette.border.normal,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarWide: {
    width: 800,
  },
  sidebarTop: {
    flex: '0 0 70%',
    overflow: 'auto',
  },
  sidebarBottom: {
    flex: '0 0 30%',
    overflow: 'auto',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
}));

const ModerationInboxInner = ({ users, posts, initialOpenedUserId, currentUser }: {
  users: SunshineUsersList[];
  posts: SunshinePostsList[];
  initialOpenedUserId: string | null;
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const { query, location } = useLocation();

  const [state, dispatch] = useReducer(
    inboxStateReducer,
    { users: [], posts: [], activeTab: 'all', focusedUserId: null, openedUserId: initialOpenedUserId, focusedPostId: null, focusedContentIndex: 0, undoQueue: [], history: [], runningLlmCheckId: null },
    (): InboxState => {
      if (users.length === 0 && posts.length === 0) {
        return {
          users: [],
          posts: [],
          activeTab: 'all',
          focusedUserId: null,
          openedUserId: null,
          focusedPostId: null,
          focusedContentIndex: 0,
          undoQueue: [],
          history: [],
          runningLlmCheckId: null,
        };
      }

      const groupedUsers = groupBy(users, user => getUserReviewGroup(user));
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, users.length, posts.length);

      // Find first non-empty tab
      const firstNonEmptyTab = visibleTabs.find(tab => tab.count > 0);
      const firstTab = firstNonEmptyTab?.group ?? 'all';
      
      if (firstTab === 'posts') {
        return {
          users,
          posts,
          activeTab: 'posts',
          focusedUserId: null,
          openedUserId: null,
          focusedPostId: posts[0]?._id ?? null,
          focusedContentIndex: 0,
          undoQueue: [],
          history: [],
          runningLlmCheckId: null,
        };
      }

      const filteredGroups = getFilteredGroups(groupedUsers, firstTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);

      return {
        users,
        posts,
        activeTab: firstTab,
        focusedUserId: orderedUsers[0]?._id ?? null,
        openedUserId: initialOpenedUserId,
        focusedPostId: null,
        focusedContentIndex: 0,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
      };
    }
  );

  // Update URL when reducer's openedUserId changes (using replace + skipRouter to avoid navigation that causes a page reload; we only care so we can send links to other mods)
  useEffect(() => {
    const currentUrlUser = query.user;
    const stateUser = state.openedUserId;
    
    if (stateUser && stateUser !== currentUrlUser) {
      navigate({
        ...location,
        search: `?user=${stateUser}`,
      }, { replace: true, skipRouter: true });
    } else if (!stateUser && currentUrlUser) {
      navigate({
        ...location,
        search: '',
      }, { replace: true, skipRouter: true });
    }
  }, [state.openedUserId, query.user, location, navigate]);

  const groupedUsers = useMemo(() => groupBy(state.users, user => getUserReviewGroup(user)), [state.users]);

  const orderedGroups = useMemo(() => (
    (Object.entries(groupedUsers) as GroupEntry[]).sort(([a]: GroupEntry, [b]: GroupEntry) => REVIEW_GROUP_TO_PRIORITY[b] - REVIEW_GROUP_TO_PRIORITY[a])
  ), [groupedUsers]);

  const allOrderedUsers = useMemo(() => orderedGroups.map(([_, users]) => users).flat(), [orderedGroups]);

  const filteredGroups = useMemo(() => {
    if (state.activeTab === 'all') {
      return orderedGroups;
    }
    return orderedGroups.filter(([group]) => group === state.activeTab);
  }, [orderedGroups, state.activeTab]);

  const orderedUsers = useMemo(() => filteredGroups.map(([_, users]) => users).flat(), [filteredGroups]);

  const visibleTabs = useMemo((): TabInfo[] => {
    return getVisibleTabsInOrder(groupedUsers, allOrderedUsers.length, state.posts.length);
  }, [groupedUsers, allOrderedUsers.length, state.posts.length]);

  const openedUser = useMemo(() => {
    if (!state.openedUserId) return null;
    return allOrderedUsers.find(u => u._id === state.openedUserId) ?? null;
  }, [state.openedUserId, allOrderedUsers]);

  const sidebarUser = useMemo(() => {
    if (openedUser) return openedUser;
    if (state.focusedUserId) {
      return allOrderedUsers.find(u => u._id === state.focusedUserId) ?? null;
    }
    return null;
  }, [openedUser, state.focusedUserId, allOrderedUsers]);

  const focusedPost = useMemo(() => {
    if (!state.focusedPostId) return null;
    return state.posts.find(p => p._id === state.focusedPostId) ?? null;
  }, [state.focusedPostId, state.posts]);

  const handleOpenUser = useCallback((userId: string) => dispatch({ type: 'OPEN_USER', userId }), []);

  const handleFocusPost = useCallback((postId: string) => dispatch({ type: 'FOCUS_POST', postId }), []);

  const handleCloseDetail = useCallback(() => dispatch({ type: 'CLOSE_DETAIL' }), []);

  const handleNextUser = useCallback(() => dispatch({ type: 'NEXT_USER' }), []);

  const handlePrevUser = useCallback(() => dispatch({ type: 'PREV_USER' }), []);

  const handleNextPost = useCallback(() => dispatch({ type: 'NEXT_POST' }), []);

  const handlePrevPost = useCallback(() => dispatch({ type: 'PREV_POST' }), []);

  const handleTabChange = useCallback((newTab: ReviewGroup | 'all' | 'posts') => dispatch({ type: 'CHANGE_TAB', tab: newTab }), []);

  const handleNextTab = useCallback(() => dispatch({ type: 'NEXT_TAB' }), []);

  const handlePrevTab = useCallback(() => dispatch({ type: 'PREV_TAB' }), []);

  const addToUndoQueue = useCallback((actionLabel: string, executeAction: () => Promise<void>) => {
    // Remove the current user (either opened or focused) from the queue and add to undo queue
    const userIdToRemove = state.openedUserId ?? state.focusedUserId;
    if (userIdToRemove) {
      const user = allOrderedUsers.find(u => u._id === userIdToRemove);
      if (user) {
        const now = Date.now();
        
        // Create timeout that will execute the action and move to history
        const timeoutId = setTimeout(() => {
          dispatch({ type: 'EXPIRE_UNDO_ITEM', userId: user._id });
          void executeAction();
        }, UNDO_QUEUE_DURATION);
        
        dispatch({
          type: 'ADD_TO_UNDO_QUEUE',
          item: {
            user,
            actionLabel,
            timestamp: now,
            expiresAt: now + UNDO_QUEUE_DURATION,
            timeoutId,
            executeAction,
          },
        });
        dispatch({ type: 'REMOVE_USER', userId: userIdToRemove });
      }
    }
  }, [state.openedUserId, state.focusedUserId, allOrderedUsers]);

  const isPostsTab = state.activeTab === 'posts';

  // Fetch user's posts and comments when a user is opened
  const { posts: userPosts, comments: userComments } = useModeratedUserContents(openedUser?._id ?? '');

  return (
    <CoreTagsKeyboardProvider>
    <div className={classes.root}>
      {isPostsTab ? (
        <ModerationPostKeyboardHandler
          onNextPost={handleNextPost}
          onPrevPost={handlePrevPost}
          onNextTab={handleNextTab}
          onPrevTab={handlePrevTab}
          selectedPost={focusedPost}
          currentUser={currentUser}
          dispatch={dispatch}
        />
      ) : (
        <ModerationUserKeyboardHandler
          onNextUser={handleNextUser}
          onPrevUser={handlePrevUser}
          onNextTab={handleNextTab}
          onPrevTab={handlePrevTab}
          onOpenDetail={() => {
            if (state.focusedUserId && !state.openedUserId) {
              handleOpenUser(state.focusedUserId);
            } else if (!state.focusedUserId && orderedUsers.length > 0) {
              handleOpenUser(orderedUsers[0]._id);
            }
          }}
          onCloseDetail={handleCloseDetail}
          selectedUser={sidebarUser}
          selectedContentIndex={state.focusedContentIndex}
          currentUser={currentUser}
          addToUndoQueue={addToUndoQueue}
          undoQueue={state.undoQueue}
          isDetailView={!!state.openedUserId}
          dispatch={dispatch}
        />
      )}
      <div className={classes.mainContent}>
        <div className={classes.leftPanel}>
          {openedUser ? (
            <ModerationDetailView 
              user={openedUser}
              posts={userPosts}
              comments={userComments}
              focusedContentIndex={state.focusedContentIndex}
              runningLlmCheckId={state.runningLlmCheckId}
              dispatch={dispatch}
              state={state}
            />
          ) : (
            <ModerationInboxList
              userGroups={filteredGroups}
              posts={state.posts}
              focusedUserId={state.focusedUserId}
              focusedPostId={state.focusedPostId}
              onFocusUser={handleOpenUser}
              onOpenUser={handleOpenUser}
              onFocusPost={handleFocusPost}
              visibleTabs={visibleTabs}
              activeTab={state.activeTab}
              onTabChange={handleTabChange}
            />
          )}
        </div>
        {/* <div className={classNames(classes.sidebar, { [classes.sidebarWide]: isPostsTab })}>
          {isPostsTab ? (
            <ModerationPostSidebar
              post={focusedPost}
              currentUser={currentUser}
              dispatch={dispatch}
            />
          ) : (
            <>
              <div className={classes.sidebarTop}>
                {sidebarUser && <ModerationSidebar
                  user={sidebarUser}
                  currentUser={currentUser}
                />}
              </div>
              <div className={classes.sidebarBottom}>
                <ModerationUndoHistory
                  undoQueue={state.undoQueue}
                  history={state.history}
                  dispatch={dispatch}
                />
              </div>
            </>
          )}
        </div> */}
      </div>
    </div>
    </CoreTagsKeyboardProvider>
  );
};

const ModerationInbox = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { query } = useLocation();

  const { data: usersData, loading: usersLoading } = useQuery(SunshineUsersListMultiQuery, {
    variables: {
      selector: { sunshineNewUsers: {} },
      limit: 100,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
  });

  const { data: postsData, loading: postsLoading } = useQuery(SunshinePostsListMultiQuery, {
    variables: {
      selector: { sunshineNewPosts: {} },
      limit: 100,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
  });

  // This is just to pre-fetch the core tags so that they're available when you open the posts tab
  useCoreTags();

  const users = useMemo(() => usersData?.users?.results.filter(user => user.needsReview) ?? [], [usersData]);
  const posts = useMemo(() => postsData?.posts?.results.filter(post => !post.reviewedByUserId) ?? [], [postsData]);

  useHydrateModerationPostCache(posts);

  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    return null;
  }

  if ((usersLoading && !usersData) || (postsLoading && !postsData)) {
    return (
      <div className={classes.loading}>
        <Loading />
      </div>
    );
  }

  const initialOpenedUserId = query.user || null;

  return <ModerationInboxInner
    users={users}
    posts={posts}
    initialOpenedUserId={initialOpenedUserId}
    currentUser={currentUser}
  />;
};

export default ModerationInbox;
