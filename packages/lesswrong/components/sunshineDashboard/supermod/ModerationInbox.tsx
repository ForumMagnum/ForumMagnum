'use client';

import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
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
import { getUserReviewGroup, type TabId } from './groupings';
import { REVIEW_GROUP_TO_PRIORITY } from '@/lib/collections/users/reviewGroups';
import { getFilteredGroups, getVisibleTabsInOrder, inboxStateReducer, initializeInboxState } from './inboxReducer';
import ModerationTabs, { type TabInfo } from './ModerationTabs';
import { UNDO_QUEUE_DURATION } from './constants';
import { useHydrateModerationPostCache } from '@/components/hooks/useHydrateModerationPostCache';
import { useCoreTags } from '@/components/tagging/useCoreTags';
import { CoreTagsKeyboardProvider } from '@/components/tagging/CoreTagsKeyboardContext';
import ModerationPostSidebar from './ModerationPostSidebar';
import CurationPostView from './CurationView';
import CurationKeyboardHandler from './CurationKeyboardHandler';
import ModerationUndoHistory from './ModerationUndoHistory';
import { getInboxSearchUpdate, getInitialOpenedUserId } from './inboxUrl';

// All of the moderation inbox's initial data is fetched in a single query so
// that its root fields (users/posts/classifiedPosts/curation/lastCurated)
// resolve concurrently server-side, rather than as a serial waterfall of
// separate useQuery suspends. (directUser is kept separate below because it
// depends on whether the opened user is already in the users list.)
const ModerationInboxDataQuery = gql(`
  query ModerationInboxDataQuery($userSelector: UserSelector, $postSelector: PostSelector, $classifiedPostSelector: PostSelector, $userLimit: Int, $postLimit: Int, $curationLimit: Int) {
    users(selector: $userSelector, limit: $userLimit) {
      results {
        ...SunshineUsersList
      }
    }
    posts(selector: $postSelector, limit: $postLimit) {
      results {
        ...SunshinePostsList
      }
    }
    classifiedPosts: posts(selector: $classifiedPostSelector, limit: $postLimit) {
      results {
        ...SunshinePostsList
      }
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

const ModerationInboxInner = ({ users, posts, classifiedPosts, curationPosts, lastCuratedDate, initialOpenedUserId, directUser, currentUser }: {
  users: SunshineUsersList[];
  posts: SunshinePostsList[];
  classifiedPosts: SunshinePostsList[];
  curationPosts: SunshineCurationPostsListItem[];
  lastCuratedDate: string | null;
  initialOpenedUserId: string | null;
  directUser: SunshineUsersList | null;
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(
    inboxStateReducer,
    { users, posts, classifiedPosts, curationPosts, initialOpenedUserId, directUser },
    initializeInboxState,
  );
  const previousOpenedUserIdRef = useRef(state.openedUserId);

  // Update URL when reducer's openedUserId changes (using replace + skipRouter to avoid navigation that causes a page reload; we only care so we can send links to other mods)
  useEffect(() => {
    const previousOpenedUserId = previousOpenedUserIdRef.current;
    previousOpenedUserIdRef.current = state.openedUserId;
    const search = getInboxSearchUpdate({
      currentSearch: window.location.search,
      previousOpenedUserId,
      openedUserId: state.openedUserId,
    });
    if (search === null) return;

    navigate({
      pathname: window.location.pathname,
      search: search ? `?${search}` : '',
      hash: window.location.hash,
    }, { replace: true, skipRouter: true });
  }, [state.openedUserId, navigate]);

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
              dispatch={dispatch}
              state={state}
            />
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
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { query } = useLocation();

  const { data, loading } = useQuery(ModerationInboxDataQuery, {
    variables: {
      userSelector: { sunshineNewUsers: {} },
      postSelector: { sunshineNewPosts: {} },
      classifiedPostSelector: { sunshineAutoClassifiedPosts: {} },
      userLimit: 100,
      postLimit: 100,
      curationLimit: 200,
    },
    fetchPolicy: 'cache-and-network',
  });

  const browserSearch = typeof window === 'undefined' ? undefined : window.location.search;
  const initialOpenedUserId = getInitialOpenedUserId(query.user, browserSearch);

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

  const directUser = useMemo(() => {
    if (!shouldFetchDirectUser) return null;
    return directUserData?.user?.result ?? null;
  }, [shouldFetchDirectUser, directUserData]);

  useHydrateModerationPostCache(posts);
  useHydrateModerationPostCache(classifiedPosts);

  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    return null;
  }

  const dataNotReady = loading && !data;
  // With cache-and-network, Apollo can return a cached null result while the
  // network request is still in flight. Mounting the reducer from that result
  // permanently loses the direct user because its initializer only runs once.
  const directUserNotReady = shouldFetchDirectUser && directUserLoading && !directUser;

  if (dataNotReady || directUserNotReady) {
    return (
      <div className={classes.loading}>
        <Loading />
      </div>
    );
  }

  return <ModerationInboxInner
    users={users}
    posts={posts}
    classifiedPosts={classifiedPosts}
    curationPosts={curationPosts}
    lastCuratedDate={lastCuratedDate}
    initialOpenedUserId={initialOpenedUserId}
    directUser={directUser}
    currentUser={currentUser}
  />;
};

export default ModerationInbox;
