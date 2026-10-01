'use client';

import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCurrentUser } from '@/components/common/withUser';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import ModerationInboxList from './ModerationInboxList';
import ModerationUserDetailView from './ModerationUserDetailView';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import ModerationUserKeyboardHandler from './ModerationUserKeyboardHandler';
import ModerationPostKeyboardHandler from './ModerationPostKeyboardHandler';
import Loading from '@/components/vulcan-core/Loading';
import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { getUserReviewGroup, type TabId } from './groupings';
import { getFilteredGroups, getOrderedGroups, getUnloadedUserIdsForTab, getVisibleTabsInOrder, InboxState, inboxStateReducer, type ReviewQueueEntry, type UnloadedPostCounts } from './inboxReducer';
import ModerationTabs, { type TabInfo } from './ModerationTabs';
import { UNDO_QUEUE_DURATION } from './constants';
import { useHydrateModerationPostCache } from '@/components/hooks/useHydrateModerationPostCache';
import { useCoreTags } from '@/components/tagging/useCoreTags';
import { CoreTagsKeyboardProvider } from '@/components/tagging/CoreTagsKeyboardContext';
import ModerationPostSidebar from './ModerationPostSidebar';
import CurationPostView from './CurationView';
import CurationKeyboardHandler from './CurationKeyboardHandler';
import ModerationUndoHistory from './ModerationUndoHistory';
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import { hideScrollBars } from '@/themes/styleUtils';

// All of the moderation inbox's initial data is fetched in a single query so
// that its root fields (users/posts/classifiedPosts/curation/lastCurated)
// resolve concurrently server-side, rather than as a serial waterfall of
// separate useQuery suspends. (directUser is kept separate below because it
// depends on whether the opened user is already in the users list.)
const ModerationInboxDataQuery = gql(`
  query ModerationInboxDataQuery($userSelector: UserSelector, $postSelector: PostSelector, $classifiedPostSelector: PostSelector, $userLimit: Int, $reviewQueueLimit: Int, $postLimit: Int, $curationLimit: Int) {
    users(selector: $userSelector, limit: $userLimit) {
      results {
        ...SunshineUsersList
      }
    }
    # Just the review group of every user in the queue, so that the tab counts
    # aren't capped at the number of fully-loaded users, and so that opening a
    # tab can load the rest of that tab's users
    reviewQueueUsers: users(selector: $userSelector, limit: $reviewQueueLimit) {
      results {
        _id
        reviewGroup
      }
    }
    posts(selector: $postSelector, limit: $postLimit, enableTotal: true) {
      results {
        ...SunshinePostsList
      }
      totalCount
    }
    classifiedPosts: posts(selector: $classifiedPostSelector, limit: $postLimit, enableTotal: true) {
      results {
        ...SunshinePostsList
      }
      totalCount
    }
    CurationCandidatePosts(limit: $curationLimit) {
      results {
        ...SunshineCurationPostsListItem
      }
    }
    LastCuratedDate {
      lastCuratedDate
    }
  }
`);

const ReviewQueueUsersQuery = gql(`
  query ReviewQueueUsersQuery($selector: UserSelector, $limit: Int) {
    users(selector: $selector, limit: $limit) {
      results {
        ...SunshineUsersList
      }
    }
  }
`);

const SingleUserSupermodQuery = gql(`
  query singleUserSupermodQuery($documentId: String) {
    user(selector: { documentId: $documentId }) {
      result {
        ...SunshineUsersList
      }
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
    // Portaled template previews can extend past the viewport. Keep the page
    // scrollable without showing an extra scrollbar alongside the sidebar.
    'html:has(&)': {
      ...hideScrollBars,
    },
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
    display: 'flex',
    flexDirection: 'row',
  },
  undoQueueSection: {
    width: 300,
    flexShrink: 0,
    borderRight: theme.palette.border.normal,
    height: '100%',
    overflow: 'auto',
  },
  inboxListContainer: {
    flex: 1,
    overflow: 'hidden',
    minWidth: 0,
  },
  postDetailPanel: {
    flex: 1,
    overflow: 'hidden',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
}));

const ModerationInboxInner = ({ users, unloadedUsers, posts, classifiedPosts, curationPosts, unloadedPosts, lastCuratedDate, initialOpenedUserId, directUser, currentUser }: {
  users: SunshineUsersList[];
  unloadedUsers: ReviewQueueEntry[];
  posts: SunshinePostsList[];
  classifiedPosts: SunshinePostsList[];
  curationPosts: SunshineCurationPostsListItem[];
  unloadedPosts: UnloadedPostCounts;
  lastCuratedDate: string | null;
  initialOpenedUserId: string | null;
  directUser: SunshineUsersList | null;
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const { query, location } = useLocation();

  const [state, dispatch] = useReducer(
    inboxStateReducer,
    { users: [], unloadedUsers: [], posts: [], classifiedPosts: [], curationPosts: [], activeTab: 'all', focusedUserId: null, openedUserId: initialOpenedUserId, focusedPostId: null, focusedContentIndex: 0, sidebarTab: null, undoQueue: [], history: [], runningLlmCheckId: null },
    (): InboxState => {
      const initialUsers = directUser ? [directUser, ...users] : users;
      if (initialUsers.length === 0 && posts.length === 0 && classifiedPosts.length === 0 && curationPosts.length === 0) {
        return {
          users: [],
          unloadedUsers: [],
          posts: [],
          classifiedPosts: [],
          curationPosts: [],
          activeTab: 'curation',
          focusedUserId: null,
          openedUserId: null,
          focusedPostId: null,
          focusedContentIndex: 0,
          sidebarTab: null,
          undoQueue: [],
          history: [],
          runningLlmCheckId: null,
        };
      }

      if (initialOpenedUserId) {
        return {
          users: initialUsers,
          unloadedUsers,
          posts,
          classifiedPosts,
          curationPosts,
          activeTab: 'all',
          focusedUserId: initialOpenedUserId,
          openedUserId: initialOpenedUserId,
          focusedPostId: null,
          focusedContentIndex: 0,
          sidebarTab: null,
          undoQueue: [],
          history: [],
          runningLlmCheckId: null,
        };
      }

      const groupedUsers = groupBy(initialUsers, user => getUserReviewGroup(user));
      const curationNoticeCount = sumBy(curationPosts, p => p.curationNotices?.length ?? 0);
      const visibleTabs = getVisibleTabsInOrder({ users: initialUsers, unloadedUsers, posts, classifiedPosts, curationPosts }, unloadedPosts);

      // Default to curation when there are no curation notices (so you can add some)
      // Otherwise, find the first non-empty non-curation tab
      const firstNonEmptyTab = curationNoticeCount === 0
        ? undefined
        : visibleTabs.find(tab => tab.group !== 'curation' && tab.count > 0);
      const firstTab = firstNonEmptyTab?.group ?? 'curation';

      if (firstTab === 'curation') {
        return { 
          users: initialUsers,
          unloadedUsers,
          posts,
          classifiedPosts,
          curationPosts,
          activeTab: 'curation',
          focusedUserId: null,
          openedUserId: null,
          focusedPostId: curationPosts[0]?._id ?? null,
          focusedContentIndex: 0,
          sidebarTab: null,
          undoQueue: [],
          history: [],
          runningLlmCheckId: null,
        };
      }
      
      if (firstTab === 'posts') {
        return {
          users: initialUsers,
          unloadedUsers,
          posts,
          classifiedPosts,
          curationPosts,
          activeTab: 'posts',
          focusedUserId: null,
          openedUserId: null,
          focusedPostId: posts[0]?._id ?? null,
          focusedContentIndex: 0,
          sidebarTab: null,
          undoQueue: [],
          history: [],
          runningLlmCheckId: null,
        };
      }

      if (firstTab === 'classifiedPosts') {
        return {
          users: initialUsers,
          unloadedUsers,
          posts,
          classifiedPosts,
          curationPosts,
          activeTab: 'classifiedPosts',
          focusedUserId: null,
          openedUserId: null,
          focusedPostId: classifiedPosts[0]?._id ?? null,
          focusedContentIndex: 0,
          sidebarTab: null,
          undoQueue: [],
          history: [],
          runningLlmCheckId: null,
        };
      }

      const filteredGroups = getFilteredGroups(groupedUsers, firstTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);

      return {
        users: initialUsers,
        unloadedUsers,
        posts,
        classifiedPosts,
        curationPosts,
        activeTab: firstTab,
        focusedUserId: orderedUsers[0]?._id ?? null,
        openedUserId: initialOpenedUserId,
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
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

  const orderedGroups = useMemo(() => getOrderedGroups(groupedUsers), [groupedUsers]);

  const allOrderedUsers = useMemo(() => orderedGroups.map(([_, users]) => users).flat(), [orderedGroups]);

  const filteredGroups = useMemo(() => {
    if (state.activeTab === 'all') {
      return orderedGroups;
    }
    return orderedGroups.filter(([group]) => group === state.activeTab);
  }, [orderedGroups, state.activeTab]);

  const orderedUsers = useMemo(() => filteredGroups.map(([_, users]) => users).flat(), [filteredGroups]);

  const visibleTabs = useMemo((): TabInfo[] => {
    return getVisibleTabsInOrder({
      users: state.users,
      unloadedUsers: state.unloadedUsers,
      posts: state.posts,
      classifiedPosts: state.classifiedPosts,
      curationPosts: state.curationPosts,
    }, unloadedPosts);
  }, [state.users, state.unloadedUsers, state.posts, state.classifiedPosts, state.curationPosts, unloadedPosts]);

  // Only the first page of the review queue is loaded up front; load the rest of a tab's users when it's opened
  const userIdsToLoad = useMemo(
    () => getUnloadedUserIdsForTab(state.unloadedUsers, state.activeTab),
    [state.unloadedUsers, state.activeTab],
  );
  const { data: tabUsersData, loading: tabUsersLoading } = useQuery(ReviewQueueUsersQuery, {
    variables: {
      selector: { usersByUserIds: { userIds: userIdsToLoad } },
      limit: userIdsToLoad.length,
    },
    skip: userIdsToLoad.length === 0,
    ssr: false,
  });
  const loadedTabUsers = tabUsersData?.users?.results;
  useEffect(() => {
    // Wait until the results are for the current set of requested users
    if (loadedTabUsers && !tabUsersLoading && userIdsToLoad.length > 0) {
      dispatch({ type: 'ADD_LOADED_USERS', requestedUserIds: userIdsToLoad, users: loadedTabUsers });
    }
  }, [loadedTabUsers, tabUsersLoading, userIdsToLoad]);

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
    const allPosts = [...state.posts, ...state.classifiedPosts];
    return allPosts.find(p => p._id === state.focusedPostId) ?? null;
  }, [state.focusedPostId, state.posts, state.classifiedPosts]);

  const focusedCurationPost = useMemo(() => {
    if (!state.focusedPostId || state.activeTab !== 'curation') return null;
    return state.curationPosts.find(p => p._id === state.focusedPostId) ?? null;
  }, [state.focusedPostId, state.activeTab, state.curationPosts]);

  const handleOpenUser = useCallback((userId: string) => dispatch({ type: 'OPEN_USER', userId }), []);

  const handleFocusPost = useCallback((postId: string) => dispatch({ type: 'FOCUS_POST', postId }), []);

  const handleCloseDetail = useCallback(() => dispatch({ type: 'CLOSE_DETAIL' }), []);

  const handleNextUser = useCallback(() => dispatch({ type: 'NEXT_USER' }), []);

  const handlePrevUser = useCallback(() => dispatch({ type: 'PREV_USER' }), []);

  const handleNextPost = useCallback(() => dispatch({ type: 'NEXT_POST' }), []);

  const handlePrevPost = useCallback(() => dispatch({ type: 'PREV_POST' }), []);

  const handleTabChange = useCallback((newTab: TabId) => {
    dispatch({ type: 'CHANGE_TAB', tab: newTab });
  }, []);

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
            sourceTab: state.activeTab,
            wasDetailView: !!state.openedUserId,
          },
        });
        dispatch({ type: 'REMOVE_USER', userId: userIdToRemove });
      }
    }
  }, [state.openedUserId, state.focusedUserId, state.activeTab, allOrderedUsers]);

  const isPostsTab = state.activeTab === 'posts' || state.activeTab === 'classifiedPosts';
  const isCurationTab = state.activeTab === 'curation';
  const isPostLikeTab = isPostsTab || isCurationTab;

  const { posts: userPosts, comments: userComments } = useModeratedUserContents(openedUser?._id ?? '');

  return (
    <CoreTagsKeyboardProvider>
    <div className={classes.root}>
      {isCurationTab ? (
        <CurationKeyboardHandler
          onNextPost={handleNextPost}
          onPrevPost={handlePrevPost}
          onNextTab={handleNextTab}
          onPrevTab={handlePrevTab}
        />
      ) : isPostsTab ? (
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
          onFocusRejectTab={() => dispatch({ type: 'SET_SIDEBAR_TAB', tab: 'reject' })}
          dispatch={dispatch}
        />
      )}
      {!openedUser && (
        <ModerationTabs
          tabs={visibleTabs}
          activeTab={state.activeTab}
          onTabChange={handleTabChange}
          lastCuratedDate={lastCuratedDate}
        />
      )}
      {/* Lazily-loaded components (eg the editor in the reject panel) suspend the
          first time they render. Without a boundary here, the nearest one is at
          the root of the app, so the whole page goes blank until they load. */}
      <SuspenseWrapper name="ModerationInboxMainContent" fallback={<Loading/>}>
      <div className={classes.mainContent}>
        <div className={classes.leftPanel}>
          {openedUser ? (
            <ModerationUserDetailView 
              currentUser={currentUser}
              user={openedUser}
              posts={userPosts}
              comments={userComments}
              focusedContentIndex={state.focusedContentIndex}
              runningLlmCheckId={state.runningLlmCheckId}
              sidebarTab={state.sidebarTab}
              addToUndoQueue={addToUndoQueue}
              dispatch={dispatch}
              state={state}
            />
          ) : (
            <>
              {!isPostLikeTab && (
                <div className={classes.undoQueueSection}>
                  <ModerationUndoHistory
                    undoQueue={state.undoQueue}
                    dispatch={dispatch}
                  />
                </div>
              )}
              <div className={classes.inboxListContainer}>
                <SuspenseWrapper name="ModerationInboxList" fallback={<Loading/>}>
                  <ModerationInboxList
                    userGroups={filteredGroups}
                    posts={state.activeTab === 'classifiedPosts' ? state.classifiedPosts : state.posts}
                    curationPosts={state.curationPosts}
                    focusedUserId={state.focusedUserId}
                    focusedPostId={state.focusedPostId}
                    onFocusUser={handleOpenUser}
                    onOpenUser={handleOpenUser}
                    onFocusPost={handleFocusPost}
                    activeTab={state.activeTab}
                  />
                </SuspenseWrapper>
              </div>
            </>
          )}
        </div>
        {isPostsTab && !openedUser && (
          <div className={classes.postDetailPanel}>
            <SuspenseWrapper name="ModerationPostSidebar" fallback={<Loading/>}>
              <ModerationPostSidebar
                post={focusedPost}
                currentUser={currentUser}
                dispatch={dispatch}
              />
            </SuspenseWrapper>
          </div>
        )}
        {isCurationTab && !openedUser && (
          <div className={classes.postDetailPanel}>
            <SuspenseWrapper name="CurationPostView" fallback={<Loading/>}>
              <CurationPostView
                post={focusedCurationPost}
                currentUser={currentUser}
              />
            </SuspenseWrapper>
          </div>
        )}
      </div>
      </SuspenseWrapper>
    </div>
    </CoreTagsKeyboardProvider>
  );
};

const ModerationInbox = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { query } = useLocation();

  const { data, loading } = useQuery(ModerationInboxDataQuery, {
    variables: {
      userSelector: { sunshineNewUsers: {} },
      postSelector: { sunshineNewPosts: {} },
      classifiedPostSelector: { sunshineAutoClassifiedPosts: {} },
      userLimit: 100,
      reviewQueueLimit: 5000,
      postLimit: 100,
      curationLimit: 200,
    },
    fetchPolicy: 'cache-and-network',
  });

  const initialOpenedUserId = query.user || null;

  const users = useMemo(() => data?.users?.results.filter(user => user.needsReview) ?? [], [data]);
  const shouldFetchDirectUser = Boolean(initialOpenedUserId) && !users.some(u => u._id === initialOpenedUserId);

  const { data: directUserData, loading: directUserLoading } = useQuery(SingleUserSupermodQuery, {
    variables: { documentId: initialOpenedUserId },
    skip: !shouldFetchDirectUser,
    fetchPolicy: 'cache-and-network',
  });

  // This is just to pre-fetch the core tags so that they're available when you open the posts tab
  useCoreTags({ ssr: false });

  const posts = useMemo(() => data?.posts?.results.filter(post => !post.reviewedByUserId) ?? [], [data]);
  const classifiedPosts = useMemo(() => data?.classifiedPosts?.results ?? [], [data]);
  const curationPosts = useMemo(() => data?.CurationCandidatePosts?.results ?? [], [data]);
  const lastCuratedDate = data?.LastCuratedDate?.lastCuratedDate ?? null;

  const unloadedPosts = useMemo((): UnloadedPostCounts => ({
    posts: Math.max(0, (data?.posts?.totalCount ?? 0) - (data?.posts?.results.length ?? 0)),
    classifiedPosts: Math.max(0, (data?.classifiedPosts?.totalCount ?? 0) - (data?.classifiedPosts?.results.length ?? 0)),
  }), [data]);

  const directUser = useMemo(() => {
    if (!shouldFetchDirectUser) return null;
    return directUserData?.user?.result ?? null;
  }, [shouldFetchDirectUser, directUserData]);

  const unloadedUsers = useMemo((): ReviewQueueEntry[] => {
    const loadedUserIds = new Set(data?.users?.results.map(user => user._id));
    if (directUser) {
      loadedUserIds.add(directUser._id);
    }
    return data?.reviewQueueUsers?.results.filter(user => !loadedUserIds.has(user._id)) ?? [];
  }, [data, directUser]);

  useHydrateModerationPostCache(posts);
  useHydrateModerationPostCache(classifiedPosts);

  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    return null;
  }

  const dataNotReady = loading && !data;
  const directUserNotReady = shouldFetchDirectUser && directUserLoading && !directUserData;

  if (dataNotReady || directUserNotReady) {
    return (
      <div className={classes.loading}>
        <Loading />
      </div>
    );
  }

  return <ModerationInboxInner
    users={users}
    unloadedUsers={unloadedUsers}
    posts={posts}
    classifiedPosts={classifiedPosts}
    curationPosts={curationPosts}
    unloadedPosts={unloadedPosts}
    lastCuratedDate={lastCuratedDate}
    initialOpenedUserId={initialOpenedUserId}
    directUser={directUser}
    currentUser={currentUser}
  />;
};

export default ModerationInbox;
