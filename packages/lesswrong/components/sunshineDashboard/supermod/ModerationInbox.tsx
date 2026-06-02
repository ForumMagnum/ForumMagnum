'use client';

import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCurrentUser } from '@/components/common/withUser';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import ModerationInboxList, { GroupEntry } from './ModerationInboxList';
import ModerationUserDetailView from './ModerationUserDetailView';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import ModerationUserKeyboardHandler from './ModerationUserKeyboardHandler';
import ModerationPostKeyboardHandler from './ModerationPostKeyboardHandler';
import Loading from '@/components/vulcan-core/Loading';
import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { getUserReviewGroup, REVIEW_GROUP_TO_PRIORITY, type TabId } from './groupings';
import { getVisibleTabsInOrder, inboxStateReducer } from './inboxReducer';
import ModerationTabs, { type TabInfo } from './ModerationTabs';
import { UNDO_QUEUE_DURATION } from './constants';
import { useHydrateModerationPostCache } from '@/components/hooks/useHydrateModerationPostCache';
import { useCoreTags } from '@/components/tagging/useCoreTags';
import { CoreTagsKeyboardProvider } from '@/components/tagging/CoreTagsKeyboardContext';
import ModerationPostSidebar from './ModerationPostSidebar';
import CurationPostView from './CurationView';
import CurationKeyboardHandler from './CurationKeyboardHandler';
import ModerationUndoHistory from './ModerationUndoHistory';

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

const SunshineAutoClassifiedPostsListMultiQuery = gql(`
  query multiPostAutoClassifiedInboxQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshinePostsList
      }
      totalCount
    }
  }
`);

const CurationCandidatePostsQuery = gql(`
  query CurationCandidatePostsQuery($limit: Int) {
    CurationCandidatePosts(limit: $limit) {
      results {
        ...SunshineCurationPostsListItem
      }
    }
  }
`);

const LastCuratedDateQuery = gql(`
  query LastCuratedDateQuery {
    LastCuratedDate {
      lastCuratedDate
    }
  }
`);

const SingleUserSupermodQuery = gql(`
  query singleUserSupermodQuery($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
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
  deepLinkLoading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

const ModerationInboxInner = ({
  users,
  posts,
  classifiedPosts,
  curationPosts,
  usersReady,
  postsReady,
  classifiedPostsReady,
  curationPostsReady,
  lastCuratedDate,
  initialOpenedUserId,
  directUser,
  currentUser,
}: {
  users: SunshineUsersList[];
  posts: SunshinePostsList[];
  classifiedPosts: SunshinePostsList[];
  curationPosts: SunshineCurationPostsListItem[];
  // Each *Ready flag flips true the first time its query resolves. We dispatch
  // a one-shot HYDRATE_LISTS into the reducer at that point so the reducer
  // takes ownership of the list (and subsequent cache-and-network refetches
  // don't clobber local mutations).
  usersReady: boolean;
  postsReady: boolean;
  classifiedPostsReady: boolean;
  curationPostsReady: boolean;
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
    {
      users: [],
      posts: [],
      classifiedPosts: [],
      curationPosts: [],
      hydratedUsers: false,
      hydratedPosts: false,
      hydratedClassifiedPosts: false,
      hydratedCurationPosts: false,
      userHasPickedTab: false,
      // When the URL pins a specific user, open them immediately and default to
      // the 'all' user-tab; otherwise default to 'curation' until data lands.
      activeTab: initialOpenedUserId ? 'all' : 'curation',
      focusedUserId: initialOpenedUserId,
      openedUserId: initialOpenedUserId,
      focusedPostId: null,
      focusedContentIndex: 0,
      undoQueue: [],
      history: [],
      runningLlmCheckId: null,
    },
  );

  // Hydrate each list into the reducer exactly once, when its query resolves.
  // After that, the reducer is the source of truth (so REMOVE_USER, UPDATE_POST,
  // etc. survive a `cache-and-network` background refetch).
  useEffect(() => {
    if (usersReady && !state.hydratedUsers) {
      const mergedUsers = directUser && !users.some(u => u._id === directUser._id)
        ? [directUser, ...users]
        : users;
      dispatch({ type: 'HYDRATE_LISTS', users: mergedUsers });
    }
  }, [usersReady, state.hydratedUsers, users, directUser]);

  useEffect(() => {
    if (postsReady && !state.hydratedPosts) {
      dispatch({ type: 'HYDRATE_LISTS', posts });
    }
  }, [postsReady, state.hydratedPosts, posts]);

  useEffect(() => {
    if (classifiedPostsReady && !state.hydratedClassifiedPosts) {
      dispatch({ type: 'HYDRATE_LISTS', classifiedPosts });
    }
  }, [classifiedPostsReady, state.hydratedClassifiedPosts, classifiedPosts]);

  useEffect(() => {
    if (curationPostsReady && !state.hydratedCurationPosts) {
      dispatch({ type: 'HYDRATE_LISTS', curationPosts });
    }
  }, [curationPostsReady, state.hydratedCurationPosts, curationPosts]);

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

  const curationNoticeCount = useMemo(() => sumBy(state.curationPosts, p => p.curationNotices?.length ?? 0), [state.curationPosts]);

  const visibleTabs = useMemo((): TabInfo[] => {
    return getVisibleTabsInOrder(groupedUsers, allOrderedUsers.length, state.posts.length, state.classifiedPosts.length, curationNoticeCount);
  }, [groupedUsers, allOrderedUsers.length, state.posts.length, state.classifiedPosts.length, curationNoticeCount]);

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
          },
        });
        dispatch({ type: 'REMOVE_USER', userId: userIdToRemove });
      }
    }
  }, [state.openedUserId, state.focusedUserId, allOrderedUsers]);

  const isPostsTab = state.activeTab === 'posts' || state.activeTab === 'classifiedPosts';
  const isCurationTab = state.activeTab === 'curation';
  const isPostLikeTab = isPostsTab || isCurationTab;

  // The active tab is "loading" until its own backing list has been hydrated
  // into the reducer. For user-group tabs (`all`, `newContent`, etc.) the
  // backing list is `users`.
  const activeTabLoading = state.activeTab === 'curation'
    ? !state.hydratedCurationPosts
    : state.activeTab === 'classifiedPosts'
      ? !state.hydratedClassifiedPosts
      : state.activeTab === 'posts'
        ? !state.hydratedPosts
        : !state.hydratedUsers;

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
          dispatch={dispatch}
        />
      )}
      {!openedUser && !(state.openedUserId && !state.hydratedUsers) && (
        <ModerationTabs
          tabs={visibleTabs}
          activeTab={state.activeTab}
          onTabChange={handleTabChange}
          lastCuratedDate={lastCuratedDate}
        />
      )}
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
              dispatch={dispatch}
              state={state}
            />
          ) : state.openedUserId && !state.hydratedUsers ? (
            // Deep-linked into a user, but the users query hasn't resolved yet.
            // Show a spinner instead of flashing the inbox.
            <div className={classes.deepLinkLoading}><Loading/></div>
          ) : (
            <>
              {!isPostLikeTab && (
                <div className={classes.undoQueueSection}>
                  <ModerationUndoHistory
                    undoQueue={state.undoQueue}
                    history={state.history}
                    dispatch={dispatch}
                  />
                </div>
              )}
              <div className={classes.inboxListContainer}>
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
                  activeTabLoading={activeTabLoading}
                />
              </div>
            </>
          )}
        </div>
        {isPostsTab && !openedUser && (
          <div className={classes.postDetailPanel}>
            <ModerationPostSidebar
              post={focusedPost}
              currentUser={currentUser}
              dispatch={dispatch}
            />
          </div>
        )}
        {isCurationTab && !openedUser && (
          <div className={classes.postDetailPanel}>
            <CurationPostView
              post={focusedCurationPost}
              currentUser={currentUser}
            />
          </div>
        )}
      </div>
    </div>
    </CoreTagsKeyboardProvider>
  );
};

const ModerationInbox = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();

  // ssr:false on every query in this admin-only page so the HTML shell ships
  // immediately on first paint. Without it, useQuery suspends the server render
  // until every query resolves (see @/lib/crud/useQuery.ts), and the slowest
  // query (CurationCandidatePosts) dominates time-to-interactive. The lists
  // hydrate independently on the client and each tab shows its own spinner.
  const { data: usersData } = useQuery(SunshineUsersListMultiQuery, {
    variables: {
      selector: { sunshineNewUsers: {} },
      limit: 100,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    ssr: false,
  });

  const { data: postsData } = useQuery(SunshinePostsListMultiQuery, {
    variables: {
      selector: { sunshineNewPosts: {} },
      limit: 100,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    ssr: false,
  });

  const { data: classifiedPostsData } = useQuery(SunshineAutoClassifiedPostsListMultiQuery, {
    variables: {
      selector: { sunshineAutoClassifiedPosts: {} },
      limit: 100,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    ssr: false,
  });

  const { data: curationData } = useQuery(CurationCandidatePostsQuery, {
    variables: { limit: 200 },
    fetchPolicy: 'cache-and-network',
    ssr: false,
  });

  const { data: lastCuratedData } = useQuery(LastCuratedDateQuery, {
    fetchPolicy: 'cache-and-network',
    ssr: false,
  });

  const initialOpenedUserId = query.user || null;

  const users = useMemo(() => usersData?.users?.results.filter(user => user.needsReview) ?? [], [usersData]);
  const shouldFetchDirectUser = Boolean(initialOpenedUserId) && !users.some(u => u._id === initialOpenedUserId);

  const { data: directUserData, loading: directUserLoading } = useQuery(SingleUserSupermodQuery, {
    variables: { documentId: initialOpenedUserId },
    skip: !shouldFetchDirectUser,
    fetchPolicy: 'cache-and-network',
    ssr: false,
  });

  // This is just to pre-fetch the core tags so that they're available when you open the posts tab
  useCoreTags({ fetchPolicy: 'cache-and-network', ssr: false });

  const posts = useMemo(() => postsData?.posts?.results.filter(post => !post.reviewedByUserId) ?? [], [postsData]);
  const classifiedPosts = useMemo(() => classifiedPostsData?.posts?.results ?? [], [classifiedPostsData]);
  const curationPosts = useMemo(() => curationData?.CurationCandidatePosts?.results ?? [], [curationData]);
  const lastCuratedDate = lastCuratedData?.LastCuratedDate?.lastCuratedDate ?? null;

  const directUser = useMemo(() => {
    if (!shouldFetchDirectUser) return null;
    return directUserData?.user?.result ?? null;
  }, [shouldFetchDirectUser, directUserData]);

  useHydrateModerationPostCache(posts);
  useHydrateModerationPostCache(classifiedPosts);

  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    return null;
  }

  // Each list is "ready" once its query has produced data (or definitively
  // finished). We render the inbox shell immediately and pass these flags down
  // so each tab can show its own spinner while it's still loading.
  const usersReady = !!usersData && (!shouldFetchDirectUser || !!directUserData || !directUserLoading);
  const postsReady = !!postsData;
  const classifiedPostsReady = !!classifiedPostsData;
  const curationPostsReady = !!curationData;

  return <ModerationInboxInner
    users={users}
    posts={posts}
    classifiedPosts={classifiedPosts}
    curationPosts={curationPosts}
    usersReady={usersReady}
    postsReady={postsReady}
    classifiedPostsReady={classifiedPostsReady}
    curationPostsReady={curationPostsReady}
    lastCuratedDate={lastCuratedDate}
    initialOpenedUserId={initialOpenedUserId}
    directUser={directUser}
    currentUser={currentUser}
  />;
};

export default ModerationInbox;
