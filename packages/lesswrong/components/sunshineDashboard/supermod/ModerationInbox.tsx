'use client';

import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCurrentUser } from '@/components/common/withUser';
import { useMessages } from '@/components/common/withMessages';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useBackgroundQuery, useQuery, useReadQuery } from '@/lib/crud/useQuery';
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
import { createInitialInboxState, getOrderedGroups, getVisibleTabsInOrder, inboxStateReducer } from './inboxReducer';
import { getModerationQueueSnapshot, type ModerationQueueSnapshot } from './moderationQueue';
import ModerationTabs, { type TabInfo } from './ModerationTabs';
import { UNDO_QUEUE_DURATION } from './constants';
import { useHydrateModerationPostCache } from '@/components/hooks/useHydrateModerationPostCache';
import { useCoreTags } from '@/components/tagging/useCoreTags';
import { CoreTagsKeyboardProvider } from '@/components/tagging/CoreTagsKeyboardContext';
import ModerationPostSidebar from './ModerationPostSidebar';
import CurationPostView from './CurationView';
import CurationKeyboardHandler from './CurationKeyboardHandler';
import ModerationUndoHistory from './ModerationUndoHistory';
import { hideScrollBars } from '@/themes/styleUtils';
import { ConcurrentModeratorChangesContext, useConcurrentModeratorChanges } from './useConcurrentModeratorChanges';

const ModerationInboxQueueQuery = gql(`
  query ModerationInboxQueueQuery($userLimit: Int!, $reviewQueueLimit: Int!, $postLimit: Int!) {
    # Must stay first, so the time is taken before the queue below is read
    supermodQueueSnapshotTime
    users: supermodQueueUsers(limit: $userLimit) {
      results {
        ...SunshineUsersList
      }
    }
    reviewQueueUsers: supermodQueueUsers(limit: $reviewQueueLimit) {
      results {
        _id
        reviewGroup
      }
    }
    posts(selector: { sunshineNewPosts: {} }, limit: $postLimit, enableTotal: true) {
      results {
        ...SunshinePostsList
      }
      totalCount
    }
    classifiedPosts: posts(selector: { sunshineAutoClassifiedPosts: {} }, limit: $postLimit, enableTotal: true) {
      results {
        ...SunshinePostsList
      }
      totalCount
    }
  }
`);

const ModerationInboxCurationQuery = gql(`
  query ModerationInboxCurationQuery {
    CurationCandidatePosts(limit: 200) {
      results {
        ...SunshineCurationPostsListItem
      }
    }
    LastCuratedDate {
      lastCuratedDate
    }
  }
`);

const REVIEW_QUEUE_LIMIT = 1000;
const initialQueueLimits = { userLimit: 200, postLimit: 100, reviewQueueLimit: REVIEW_QUEUE_LIMIT };
const fullQueueLimits = { userLimit: REVIEW_QUEUE_LIMIT, postLimit: REVIEW_QUEUE_LIMIT, reviewQueueLimit: REVIEW_QUEUE_LIMIT };

const SingleUserSupermodQuery = gql(`
  query singleUserSupermodQuery($documentId: String) {
    user(selector: { _id: $documentId }) {
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

const ModerationInboxInner = ({ queue, curationPosts, lastCuratedDate, queueSnapshotTime, initialOpenedUserId, currentUser }: {
  queue: ModerationQueueSnapshot;
  curationPosts: SunshineCurationPostsListItem[];
  lastCuratedDate: string | null;
  queueSnapshotTime: string;
  initialOpenedUserId: string | null;
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const { query, location } = useLocation();
  const apolloClient = useApolloClient();
  const { flash } = useMessages();
  const [loadingRemaining, setLoadingRemaining] = useState(false);
  const [state, dispatch] = useReducer(inboxStateReducer, { queue, curationPosts, initialOpenedUserId }, createInitialInboxState);
  const [changesSince] = useState(() => new Date(queueSnapshotTime));
  const concurrentModeratorChanges = useConcurrentModeratorChanges(state.loadedUserIds, state.loadedPostIds, changesSince);

  useHydrateModerationPostCache(state.posts);
  useHydrateModerationPostCache(state.classifiedPosts);

  const handleLoadRemaining = useCallback(async () => {
    if (loadingRemaining) return;
    setLoadingRemaining(true);
    try {
      // Keep bulk-load errors out of the initial Suspense query, preserving the inbox and undo state.
      const { data } = await apolloClient.query({
        query: ModerationInboxQueueQuery,
        variables: fullQueueLimits,
        fetchPolicy: 'network-only',
      });
      if (!data) throw new Error('Moderation queue data failed to load');
      dispatch({ type: 'ADD_LOADED_ITEMS', snapshot: getModerationQueueSnapshot(data) });
    } catch (error) {
      flash({ messageString: `Failed to load remaining queue items: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
    } finally {
      setLoadingRemaining(false);
    }
  }, [apolloClient, flash, loadingRemaining]);

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

  const curationNoticeCount = useMemo(() => sumBy(state.curationPosts, p => p.curationNotices?.length ?? 0), [state.curationPosts]);

  const visibleTabs = useMemo(
    (): TabInfo[] => getVisibleTabsInOrder(groupedUsers, allOrderedUsers.length, state.posts.length, state.classifiedPosts.length, curationNoticeCount, state.unloadedCounts),
    [groupedUsers, allOrderedUsers.length, state.posts.length, state.classifiedPosts.length, curationNoticeCount, state.unloadedCounts]
  );

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
    <ConcurrentModeratorChangesContext.Provider value={concurrentModeratorChanges}>
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
                  unloadedCount={state.unloadedCounts[state.activeTab] ?? 0}
                  onLoadUnloaded={handleLoadRemaining}
                  loadingUnloaded={loadingRemaining}
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
    </ConcurrentModeratorChangesContext.Provider>
  );
};

const ModerationInboxLoader = ({ currentUser }: { currentUser: UsersCurrent }) => {
  const classes = useStyles(styles);
  const { query } = useLocation();
  const [initialOpenedUserId] = useState(() => query.user || null);

  // Start both requests before reading either, so SSR does not suspend them serially.
  const [queueRef] = useBackgroundQuery(ModerationInboxQueueQuery, {
    variables: initialQueueLimits,
    fetchPolicy: 'cache-and-network',
  });
  const [curationRef] = useBackgroundQuery(ModerationInboxCurationQuery, {
    fetchPolicy: 'cache-and-network',
  });
  const { data } = useReadQuery(queueRef);
  const { data: curationData } = useReadQuery(curationRef);

  // This lookup gates initialization only; a later queue refresh must not unmount the inbox.
  const [queuedDirectUser] = useState(() => data.users?.results.find(user => user._id === initialOpenedUserId));
  const shouldFetchDirectUser = Boolean(initialOpenedUserId) && !queuedDirectUser;
  const { data: directUserData, loading: directUserLoading } = useQuery(SingleUserSupermodQuery, {
    variables: { documentId: initialOpenedUserId },
    skip: !shouldFetchDirectUser,
    fetchPolicy: 'cache-and-network',
  });
  const directUser = queuedDirectUser ?? directUserData?.user?.result ?? null;
  const queue = useMemo(() => getModerationQueueSnapshot(data, directUser), [data, directUser]);

  // Pre-fetch core tags for the posts tab.
  useCoreTags({ ssr: false });

  if (shouldFetchDirectUser && directUserLoading && !directUserData) {
    return <div className={classes.loading}><Loading /></div>;
  }

  return <ModerationInboxInner
    queue={queue}
    curationPosts={curationData.CurationCandidatePosts?.results ?? []}
    lastCuratedDate={curationData.LastCuratedDate.lastCuratedDate}
    queueSnapshotTime={data.supermodQueueSnapshotTime}
    initialOpenedUserId={initialOpenedUserId}
    currentUser={currentUser}
  />;
};

const ModerationInbox = () => {
  const currentUser = useCurrentUser();
  if (!currentUser || !userIsAdminOrMod(currentUser)) return null;
  return <ModerationInboxLoader currentUser={currentUser} />;
};

export default ModerationInbox;
