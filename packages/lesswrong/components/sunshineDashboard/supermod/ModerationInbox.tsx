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
import ModerationSidebar from './ModerationSidebar';
import ModerationKeyboardHandler from './ModerationKeyboardHandler';
import Loading from '@/components/vulcan-core/Loading';
import groupBy from 'lodash/groupBy';
import { getUserReviewGroup, REVIEW_GROUP_TO_PRIORITY, getTabsInPriorityOrder, type ReviewGroup } from './groupings';
import type { TabInfo } from './ModerationTabs';

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

const styles = defineStyles('ModerationInbox', (theme: ThemeType) => ({
  root: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    overflow: 'hidden',
    position: 'fixed',
    marginTop: -50,
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
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
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  }));

/**
 * Moderation Inbox State Machine
 * 
 * ## States
 * - Inbox View: openedUserId=null, viewing list with optional focus
 * - Detail View: openedUserId!=null, viewing single user details
 * 
 * ## State Transitions
 * 1. OPEN_USER: Inbox View → Detail View
 * 2. CLOSE_DETAIL: Detail View → Inbox View (restores focus to opened user)
 * 3. CHANGE_TAB: Inbox View → Inbox View (switches tab, focuses first user in new tab)
 * 4. NEXT_USER/PREV_USER: Navigates within current tab (works in both views)
 * 5. NEXT_TAB/PREV_TAB: Switches tabs (only in Inbox View)
 * 6. REMOVE_USER: Removes user from local list and navigates to next
 *    - If current tab has more users → navigate to next user at same index
 *    - If current tab is now empty → switch to next non-empty tab
 *    - If no users left → return to empty Inbox View
 * 
 * The reducer maintains a local copy of the user list that is mutated when actions complete.
 * No refetching happens - the list is only updated via REMOVE_USER actions.
 * 
 * The reducer is initialized lazily with user data passed from the component.
 */


export type InboxState = {
  // The local copy of users (mutated when actions complete)
  users: SunshineUsersList[];
  // Current active tab
  activeTab: ReviewGroup | 'all';
  // Focused user in inbox view
  focusedUserId: string | null;
  // Opened user in detail view
  openedUserId: string | null;
  // Index of focused content item in detail view
  focusedContentIndex: number;
};

export type InboxAction =
  | { type: 'OPEN_USER'; userId: string }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'CHANGE_TAB'; tab: ReviewGroup | 'all' }
  | { type: 'NEXT_USER' }
  | { type: 'PREV_USER' }
  | { type: 'NEXT_TAB' }
  | { type: 'PREV_TAB' }
  | { type: 'REMOVE_USER'; userId: string }
  | { type: 'NEXT_CONTENT'; contentLength: number }
  | { type: 'PREV_CONTENT'; contentLength: number }
  | { type: 'UPDATE_USER_NOTES'; userId: string; sunshineNotes: string };

// Helper to get filtered groups for a tab
function getFilteredGroups(
  groupedUsers: Partial<Record<ReviewGroup, SunshineUsersList[]>>,
  activeTab: ReviewGroup | 'all'
): GroupEntry[] {
  const orderedGroups = (Object.entries(groupedUsers) as GroupEntry[])
    .sort(([a]: GroupEntry, [b]: GroupEntry) => REVIEW_GROUP_TO_PRIORITY[b] - REVIEW_GROUP_TO_PRIORITY[a]);
  
  if (activeTab === 'all') {
    return orderedGroups;
  }
  return orderedGroups.filter(([group]) => group === activeTab);
}

function getVisibleTabsInOrder(
  groupedUsers: Partial<Record<ReviewGroup, SunshineUsersList[]>>,
  totalUsers: number,
): TabInfo[] {
  const tabsInOrder = getTabsInPriorityOrder();
  const tabs: TabInfo[] = [];
  
  for (const group of tabsInOrder) {
    const count = groupedUsers[group]?.length ?? 0;
    if (count > 0) {
      tabs.push({ group, count });
    }
  }
  
  tabs.push({ group: 'all', count: totalUsers });
  
  return tabs;
}

export function inboxStateReducer(state: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case 'OPEN_USER': {
      return {
        ...state,
        openedUserId: action.userId,
        focusedContentIndex: 0, // Start at first content item
      };
    }
    
    case 'CLOSE_DETAIL': {
      return {
        ...state,
        openedUserId: null,
        focusedContentIndex: 0,
        // Restore focus to the user that was open
        focusedUserId: state.openedUserId,
      };
    }
    
    case 'NEXT_CONTENT': {
      if (!state.openedUserId || action.contentLength === 0) return state;
      const nextIndex = (state.focusedContentIndex + 1) % action.contentLength;
      return {
        ...state,
        focusedContentIndex: nextIndex,
      };
    }
    
    case 'PREV_CONTENT': {
      if (!state.openedUserId || action.contentLength === 0) return state;
      const prevIndex = state.focusedContentIndex <= 0 
        ? action.contentLength - 1 
        : state.focusedContentIndex - 1;
      return {
        ...state,
        focusedContentIndex: prevIndex,
      };
    }
    
    case 'UPDATE_USER_NOTES': {
      const updatedUsers = state.users.map(user => 
        user._id === action.userId 
          ? { ...user, sunshineNotes: action.sunshineNotes }
          : user
      );
      return {
        ...state,
        users: updatedUsers,
      };
    }
    
    case 'CHANGE_TAB': {
      // Don't change tabs in detail view
      if (state.openedUserId) return state;
      
      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const filteredGroups = getFilteredGroups(groupedUsers, action.tab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);
      
      return {
        ...state,
        activeTab: action.tab,
        focusedUserId: orderedUsers[0]?._id ?? null,
        focusedContentIndex: 0,
      };
    }
    
    case 'NEXT_USER': {
      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const filteredGroups = getFilteredGroups(groupedUsers, state.activeTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);
      
      if (orderedUsers.length === 0) return state;
      
      const currentId = state.openedUserId ?? state.focusedUserId;
      const currentIndex = orderedUsers.findIndex(u => u._id === currentId);
      const nextIndex = (currentIndex + 1) % orderedUsers.length;
      const nextUserId = orderedUsers[nextIndex]._id;
      
      if (state.openedUserId) {
        return { ...state, openedUserId: nextUserId, focusedContentIndex: 0 };
      } else {
        return { ...state, focusedUserId: nextUserId };
      }
    }
    
    case 'PREV_USER': {
      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const filteredGroups = getFilteredGroups(groupedUsers, state.activeTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);
      
      if (orderedUsers.length === 0) return state;
      
      const currentId = state.openedUserId ?? state.focusedUserId;
      const currentIndex = orderedUsers.findIndex(u => u._id === currentId);
      const prevIndex = currentIndex <= 0 ? orderedUsers.length - 1 : currentIndex - 1;
      const prevUserId = orderedUsers[prevIndex]._id;
      
      if (state.openedUserId) {
        return { ...state, openedUserId: prevUserId, focusedContentIndex: 0 };
      } else {
        return { ...state, focusedUserId: prevUserId };
      }
    }
    
    case 'NEXT_TAB': {
      if (state.openedUserId) return state;
      
      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, state.users.length);
      
      if (visibleTabs.length === 0) return state;
      
      const currentIndex = visibleTabs.findIndex(tab => tab.group === state.activeTab);
      const nextIndex = (currentIndex + 1) % visibleTabs.length;
      const nextTab = visibleTabs[nextIndex].group;
      
      const filteredGroups = getFilteredGroups(groupedUsers, nextTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);
      
      return {
        ...state,
        activeTab: nextTab,
        focusedUserId: orderedUsers[0]?._id ?? null,
        focusedContentIndex: 0,
      };
    }
    
    case 'PREV_TAB': {
      if (state.openedUserId) return state;
      
      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, state.users.length);
      
      if (visibleTabs.length === 0) return state;
      
      const currentIndex = visibleTabs.findIndex(tab => tab.group === state.activeTab);
      const prevIndex = currentIndex <= 0 ? visibleTabs.length - 1 : currentIndex - 1;
      const prevTab = visibleTabs[prevIndex].group;
      
      const filteredGroups = getFilteredGroups(groupedUsers, prevTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);
      
      return {
        ...state,
        activeTab: prevTab,
        focusedUserId: orderedUsers[0]?._id ?? null,
        focusedContentIndex: 0,
      };
    }
    
    case 'REMOVE_USER': {
      const newUsers = state.users.filter(u => u._id !== action.userId);
      
      if (newUsers.length === 0) {
        return {
          users: [],
          activeTab: 'all',
          focusedUserId: null,
          openedUserId: null,
          focusedContentIndex: 0,
        };
      }
      
      // Recalculate groups and tabs
      const groupedUsers = groupBy(newUsers, user => getUserReviewGroup(user));
      const filteredGroups = getFilteredGroups(groupedUsers, state.activeTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);
      
      // If current tab still has users
      if (orderedUsers.length > 0) {
        // Find where we were in the list
        const oldGroupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
        const oldFilteredGroups = getFilteredGroups(oldGroupedUsers, state.activeTab);
        const oldOrderedUsers = oldFilteredGroups.flatMap(([_, users]) => users);
        
        const currentId = state.openedUserId ?? state.focusedUserId;
        const oldIndex = oldOrderedUsers.findIndex(u => u._id === currentId);
        
        // After removal, stay at same index (which is now the next user)
        // If we were at the end, wrap to 0
        const nextIndex = oldIndex >= orderedUsers.length ? 0 : Math.max(0, oldIndex);
        const nextUserId = orderedUsers[nextIndex]._id;
        
        if (state.openedUserId) {
          return {
            users: newUsers,
            activeTab: state.activeTab,
            focusedUserId: null,
            openedUserId: nextUserId,
            focusedContentIndex: 0,
          };
        } else {
          return {
            users: newUsers,
            activeTab: state.activeTab,
            focusedUserId: nextUserId,
            openedUserId: null,
            focusedContentIndex: 0,
          };
        }
      }
      
      // Current tab is empty, switch to next non-empty tab
      const tabsInOrder = getTabsInPriorityOrder();
      let nextTab: ReviewGroup | 'all' = 'all';
      
      for (const group of tabsInOrder) {
        if (groupedUsers[group]?.length > 0) {
          nextTab = group;
          break;
        }
      }
      
      const nextFilteredGroups = getFilteredGroups(groupedUsers, nextTab);
      const nextOrderedUsers = nextFilteredGroups.flatMap(([_, users]) => users);
      
      if (nextOrderedUsers.length > 0) {
        const nextUserId = nextOrderedUsers[0]._id;
        
        // When switching tabs due to current tab being empty,
        // always return to inbox view (not detail view)
        return {
          users: newUsers,
          activeTab: nextTab,
          focusedUserId: nextUserId,
          openedUserId: null,
          focusedContentIndex: 0,
        };
      }
      
      // Fallback: no users anywhere
      return {
        users: newUsers,
        activeTab: 'all',
        focusedUserId: null,
        openedUserId: null,
        focusedContentIndex: 0,
      };
    }
    
    default:
      return state;
  }
}

const ModerationInboxInner = ({ users, initialOpenedUserId, currentUser }: {
  users: SunshineUsersList[];
  initialOpenedUserId: string | null;
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const { query, location } = useLocation();

  // Initialize reducer with data and URL parameter immediately
  const [state, dispatch] = useReducer(
    inboxStateReducer,
    { users: [], activeTab: 'all', focusedUserId: null, openedUserId: initialOpenedUserId, focusedContentIndex: 0 },
    (): InboxState => {
      // Compute initial state from users
      if (users.length === 0) {
        return {
          users: [],
          activeTab: 'all',
          focusedUserId: null,
          openedUserId: null,
          focusedContentIndex: 0,
        };
      }

      const groupedUsers = groupBy(users, user => getUserReviewGroup(user));
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, users.length);

      const firstTab = visibleTabs[0]?.group ?? 'all';
      const filteredGroups = getFilteredGroups(groupedUsers, firstTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);

      return {
        users,
        activeTab: firstTab,
        focusedUserId: orderedUsers[0]?._id ?? null,
        openedUserId: initialOpenedUserId,
        focusedContentIndex: 0,
      };
    }
  );

  // Update URL when reducer's openedUserId changes (using replace + skipRouter to avoid navigation events)
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

  // Compute derived state from reducer state
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
    return getVisibleTabsInOrder(groupedUsers, allOrderedUsers.length);
  }, [groupedUsers, allOrderedUsers.length]);

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

  const handleOpenUser = useCallback((userId: string) => dispatch({ type: 'OPEN_USER', userId }), []);

  const handleCloseDetail = useCallback(() => dispatch({ type: 'CLOSE_DETAIL' }), []);

  const handleNextUser = useCallback(() => dispatch({ type: 'NEXT_USER' }), []);

  const handlePrevUser = useCallback(() => dispatch({ type: 'PREV_USER' }), []);

  const handleTabChange = useCallback((newTab: ReviewGroup | 'all') => dispatch({ type: 'CHANGE_TAB', tab: newTab }), []);

  const handleNextTab = useCallback(() => dispatch({ type: 'NEXT_TAB' }), []);

  const handlePrevTab = useCallback(() => dispatch({ type: 'PREV_TAB' }), []);

  const handleActionComplete = useCallback(() => {
    // Remove the current user (either opened or focused) from the queue
    const userIdToRemove = state.openedUserId ?? state.focusedUserId;
    if (userIdToRemove) {
      dispatch({ type: 'REMOVE_USER', userId: userIdToRemove });
    }
  }, [state.openedUserId, state.focusedUserId]);

  return (
    <div className={classes.root}>
      <ModerationKeyboardHandler
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
        currentUser={currentUser}
        onActionComplete={handleActionComplete}
        isDetailView={!!state.openedUserId}
        dispatch={dispatch}
      />
      <div className={classes.mainContent}>
        <div className={classes.leftPanel}>
          {openedUser ? (
            <ModerationDetailView 
              user={openedUser}
              focusedContentIndex={state.focusedContentIndex}
              dispatch={dispatch}
            />
          ) : (
            <ModerationInboxList
              userGroups={filteredGroups}
              focusedUserId={state.focusedUserId}
              onFocusUser={handleOpenUser}
              onOpenUser={handleOpenUser}
              visibleTabs={visibleTabs}
              activeTab={state.activeTab}
              onTabChange={handleTabChange}
            />
          )}
        </div>
        <div className={classes.sidebar}>
          {sidebarUser && <ModerationSidebar
            user={sidebarUser}
            currentUser={currentUser}
            inDetailView={!!state.openedUserId}
          />}
        </div>
      </div>
    </div>
  );
};

const ModerationInbox = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { query } = useLocation();

  const { data, loading } = useQuery(SunshineUsersListMultiQuery, {
    variables: {
      selector: { sunshineNewUsers: {} },
      limit: 100,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
  });

  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    return null;
  }

  if (loading && !data) {
    return (
      <div className={classes.loading}>
        <Loading />
      </div>
    );
  }

  const users = data?.users?.results.filter(user => user.needsReview) ?? [];
  const initialOpenedUserId = query.user || null;

  return <ModerationInboxInner users={users} initialOpenedUserId={initialOpenedUserId} currentUser={currentUser} />;
};

export default ModerationInbox;
