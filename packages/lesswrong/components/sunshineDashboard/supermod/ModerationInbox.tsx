'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  leftPanel: {
    flex: 1,
    overflow: 'auto',
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
 * - Uninitialized: isInitialized=false, waiting for initial data
 * - Inbox View: isInitialized=true, openedUserId=null, viewing list with optional focus
 * - Detail View: isInitialized=true, openedUserId!=null, viewing single user details
 * 
 * ## State Transitions
 * 1. INITIALIZE: Uninitialized → Inbox View (with first tab, first user focused)
 * 2. OPEN_USER: Inbox View → Detail View
 * 3. CLOSE_DETAIL: Detail View → Inbox View (restores focus to opened user)
 * 4. CHANGE_TAB: Inbox View → Inbox View (switches tab, focuses first user in new tab)
 * 5. NEXT_USER/PREV_USER: Navigates within current tab (works in both views)
 * 6. NEXT_TAB/PREV_TAB: Switches tabs (only in Inbox View)
 * 7. REMOVE_USER: Removes user from local list and navigates to next
 *    - If current tab has more users → navigate to next user at same index
 *    - If current tab is now empty → switch to next non-empty tab
 *    - If no users left → return to empty Inbox View
 * 
 * The reducer maintains a local copy of the user list that is mutated when actions complete.
 * No refetching happens - the list is only updated via REMOVE_USER actions.
 */

// Helper types
type SunshineUserFragment = FragmentTypes['SunshineUsersList'];

type InboxState = {
  // The local copy of users (mutated when actions complete)
  users: SunshineUserFragment[];
  // Current active tab
  activeTab: ReviewGroup | 'all';
  // Focused user in inbox view (highlighted)
  focusedUserId: string | null;
  // Opened user in detail view
  openedUserId: string | null;
  // Whether we've completed initialization
  isInitialized: boolean;
};

type InboxAction =
  | { type: 'INITIALIZE'; users: SunshineUserFragment[] }
  | { type: 'OPEN_USER'; userId: string }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'CHANGE_TAB'; tab: ReviewGroup | 'all' }
  | { type: 'NEXT_USER' }
  | { type: 'PREV_USER' }
  | { type: 'NEXT_TAB' }
  | { type: 'PREV_TAB' }
  | { type: 'REMOVE_USER'; userId: string };

// Helper to get filtered groups for a tab
function getFilteredGroups(
  groupedUsers: Partial<Record<ReviewGroup, SunshineUserFragment[]>>,
  activeTab: ReviewGroup | 'all'
): GroupEntry[] {
  const orderedGroups = (Object.entries(groupedUsers) as GroupEntry[])
    .sort(([a]: GroupEntry, [b]: GroupEntry) => REVIEW_GROUP_TO_PRIORITY[b] - REVIEW_GROUP_TO_PRIORITY[a]);
  
  if (activeTab === 'all') {
    return orderedGroups;
  }
  return orderedGroups.filter(([group]) => group === activeTab);
}

// Helper to get visible tabs
function getVisibleTabsInOrder(
  groupedUsers: Partial<Record<ReviewGroup, SunshineUserFragment[]>>,
  totalUsers: number,
  isInitialized: boolean
): TabInfo[] {
  const tabsInOrder = getTabsInPriorityOrder();
  const tabs: TabInfo[] = [];
  
  for (const group of tabsInOrder) {
    const count = groupedUsers[group]?.length ?? 0;
    if (count > 0) {
      tabs.push({ group, count });
    }
  }
  
  // Add 'all' tab if initialized
  if (isInitialized) {
    tabs.push({ group: 'all', count: totalUsers });
  }
  
  return tabs;
}

function inboxStateReducer(state: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case 'INITIALIZE': {
      const users = action.users;
      if (users.length === 0) {
        return {
          users: [],
          activeTab: 'all',
          focusedUserId: null,
          openedUserId: null,
          isInitialized: true,
        };
      }
      
      const groupedUsers = groupBy(users, user => getUserReviewGroup(user));
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, users.length, false);
      
      const firstTab = visibleTabs[0]?.group ?? 'all';
      const filteredGroups = getFilteredGroups(groupedUsers, firstTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);
      
      return {
        users,
        activeTab: firstTab,
        focusedUserId: orderedUsers[0]?._id ?? null,
        openedUserId: null,
        isInitialized: true,
      };
    }
    
    case 'OPEN_USER': {
      return {
        ...state,
        openedUserId: action.userId,
      };
    }
    
    case 'CLOSE_DETAIL': {
      return {
        ...state,
        openedUserId: null,
        // Restore focus to the user that was open
        focusedUserId: state.openedUserId,
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
        return { ...state, openedUserId: nextUserId };
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
        return { ...state, openedUserId: prevUserId };
      } else {
        return { ...state, focusedUserId: prevUserId };
      }
    }
    
    case 'NEXT_TAB': {
      if (state.openedUserId) return state;
      
      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, state.users.length, state.isInitialized);
      
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
      };
    }
    
    case 'PREV_TAB': {
      if (state.openedUserId) return state;
      
      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, state.users.length, state.isInitialized);
      
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
      };
    }
    
    case 'REMOVE_USER': {
      // Remove user from local list
      const newUsers = state.users.filter(u => u._id !== action.userId);
      
      if (newUsers.length === 0) {
        // No users left
        return {
          users: [],
          activeTab: 'all',
          focusedUserId: null,
          openedUserId: null,
          isInitialized: true,
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
            isInitialized: true,
          };
        } else {
          return {
            users: newUsers,
            activeTab: state.activeTab,
            focusedUserId: nextUserId,
            openedUserId: null,
            isInitialized: true,
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
        
        if (state.openedUserId) {
          return {
            users: newUsers,
            activeTab: nextTab,
            focusedUserId: null,
            openedUserId: nextUserId,
            isInitialized: true,
          };
        } else {
          return {
            users: newUsers,
            activeTab: nextTab,
            focusedUserId: nextUserId,
            openedUserId: null,
            isInitialized: true,
          };
        }
      }
      
      // Fallback: no users anywhere
      return {
        users: newUsers,
        activeTab: 'all',
        focusedUserId: null,
        openedUserId: null,
        isInitialized: true,
      };
    }
    
    default:
      return state;
  }
}

const ModerationInbox = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const { query, location } = useLocation();

  // focusedUserId: which user is highlighted in the inbox (shown in sidebar)
  // openedUserId: which user has detail view open (from URL)
  const openedUserId = query.user;
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewGroup | 'all' | null>(null);
  const hasInitializedTab = useRef(false);

  const { data, loading, refetch } = useQuery(SunshineUsersListMultiQuery, {
    variables: {
      selector: { sunshineNewUsers: {} },
      limit: 100,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
  });

  const users = useMemo(() => {
    return data?.users?.results.filter(user => user.needsReview) ?? [];
  }, [data]);

  const groupedUsers = useMemo(() => groupBy(users, user => getUserReviewGroup(user)), [users]);

  const orderedGroups = useMemo(() => (
    (Object.entries(groupedUsers) as GroupEntry[]).sort(([a]: GroupEntry, [b]: GroupEntry) => REVIEW_GROUP_TO_PRIORITY[b] - REVIEW_GROUP_TO_PRIORITY[a])
  ), [groupedUsers]);

  const allOrderedUsers = useMemo(() => orderedGroups.map(([_, users]) => users).flat(), [orderedGroups]);

  // Filter users based on active tab
  const filteredGroups = useMemo(() => {
    if (activeTab === 'all') {
      return orderedGroups;
    }
    return orderedGroups.filter(([group]) => group === activeTab);
  }, [orderedGroups, activeTab]);

  const orderedUsers = useMemo(() => filteredGroups.map(([_, users]) => users).flat(), [filteredGroups]);

  // Calculate visible tabs (tabs with users, plus 'all' tab)
  const visibleTabs = useMemo((): TabInfo[] => {
    const tabsInOrder = getTabsInPriorityOrder();
    const tabs: TabInfo[] = [];
    
    for (const group of tabsInOrder) {
      const count = groupedUsers[group]?.length ?? 0;
      if (count > 0) {
        tabs.push({ group, count });
      }
    }
    
    if (!loading) {
      // Add 'all' tab at the end if we're done loading
      // Don't otherwise, since we want to show the first tab rather than the all tab by default
      tabs.push({ group: 'all', count: allOrderedUsers.length });
    }
    
    return tabs;
  }, [groupedUsers, loading, allOrderedUsers.length]);

  // Set initial active tab to first non-empty group
  useEffect(() => {
    if (!hasInitializedTab.current && visibleTabs.length > 0 && activeTab === null) {
      // Set to first non-empty tab, or 'all' if only 'all' is available
      const firstTab = visibleTabs[0];
      setActiveTab(firstTab.group);
      hasInitializedTab.current = true;
    }
  }, [visibleTabs, activeTab]);

  // Auto-focus first user when data loads or tab changes
  useEffect(() => {
    if (orderedUsers.length > 0 && !focusedUserId && !openedUserId) {
      setFocusedUserId(orderedUsers[0]._id);
    }
  }, [orderedUsers, focusedUserId, openedUserId]);

  const openedUser = useMemo(() => {
    if (!openedUserId) return null;
    return allOrderedUsers.find(u => u._id === openedUserId) ?? null;
  }, [openedUserId, allOrderedUsers]);

  // In inbox view, show focused user in sidebar
  // In detail view, show opened user in sidebar
  const sidebarUser = openedUser || (focusedUserId ? allOrderedUsers.find(u => u._id === focusedUserId) ?? null : null);

  const focusedIndex = useMemo(() => {
    if (openedUserId) {
      return orderedUsers.findIndex(u => u._id === openedUserId);
    }
    if (!focusedUserId) return -1;
    return orderedUsers.findIndex(u => u._id === focusedUserId);
  }, [focusedUserId, openedUserId, orderedUsers]);

  const handleFocusUser = useCallback((userId: string | null) => {
    setFocusedUserId(userId);
  }, []);

  const handleOpenUser = useCallback((userId: string | null) => {
    if (userId) {
      navigate({
        ...location,
        search: `?user=${userId}`,
      });
    } else {
      navigate({
        ...location,
        search: '',
      });
    }
  }, [location, navigate]);

  const handleNextUser = useCallback(() => {
    if (orderedUsers.length === 0) return;

    const currentIndex = focusedIndex >= 0 ? focusedIndex : -1;
    const nextIndex = (currentIndex + 1) % orderedUsers.length;

    if (openedUserId) {
      // In detail view, navigate to next user
      handleOpenUser(orderedUsers[nextIndex]._id);
    } else {
      // In inbox view, just focus next user
      handleFocusUser(orderedUsers[nextIndex]._id);
    }
  }, [orderedUsers, focusedIndex, openedUserId, handleOpenUser, handleFocusUser]);

  const handlePrevUser = useCallback(() => {
    if (orderedUsers.length === 0) return;

    const currentIndex = focusedIndex >= 0 ? focusedIndex : 0;
    const prevIndex = currentIndex === 0 ? orderedUsers.length - 1 : currentIndex - 1;

    if (openedUserId) {
      // In detail view, navigate to prev user
      handleOpenUser(orderedUsers[prevIndex]._id);
    } else {
      // In inbox view, just focus prev user
      handleFocusUser(orderedUsers[prevIndex]._id);
    }
  }, [orderedUsers, focusedIndex, openedUserId, handleOpenUser, handleFocusUser]);

  const handleCloseDetail = useCallback(() => {
    handleOpenUser(null);
    // Restore focus to the user that was open
    if (openedUserId) {
      setFocusedUserId(openedUserId);
    }
  }, [handleOpenUser, openedUserId]);

  const handleTabChange = useCallback((newTab: ReviewGroup | 'all') => {
    // Don't allow tab changes when in detail view
    if (openedUserId) return;
    
    setActiveTab(newTab);
    // Reset to first user in new tab
    // We need to recalculate orderedUsers for the new tab
    const newFilteredGroups = newTab === 'all' 
      ? orderedGroups 
      : orderedGroups.filter(([group]) => group === newTab);
    const newOrderedUsers = newFilteredGroups.map(([_, users]) => users).flat();
    
    if (newOrderedUsers.length > 0) {
      setFocusedUserId(newOrderedUsers[0]._id);
    } else {
      setFocusedUserId(null);
    }
  }, [openedUserId, orderedGroups]);

  const handleNextTab = useCallback(() => {
    if (openedUserId) return; // Don't switch tabs in detail view
    
    const currentIndex = visibleTabs.findIndex(tab => tab.group === activeTab);
    const nextIndex = (currentIndex + 1) % visibleTabs.length;
    handleTabChange(visibleTabs[nextIndex].group);
  }, [visibleTabs, activeTab, openedUserId, handleTabChange]);

  const handlePrevTab = useCallback(() => {
    if (openedUserId) return; // Don't switch tabs in detail view
    
    const currentIndex = visibleTabs.findIndex(tab => tab.group === activeTab);
    const prevIndex = currentIndex === 0 ? visibleTabs.length - 1 : currentIndex - 1;
    handleTabChange(visibleTabs[prevIndex].group);
  }, [visibleTabs, activeTab, openedUserId, handleTabChange]);

  const handleActionComplete = useCallback(async () => {
    // Capture current state before refetch
    const currentTab = activeTab;
    const wasInDetailView = !!openedUserId;
    const currentFocusedIndex = focusedIndex;
    
    // Optimistically navigate to next user BEFORE refetch to prevent flash
    // Calculate next user based on current state
    if (orderedUsers.length > 1) {
      // There are other users in the current list
      // After removal, the user at currentFocusedIndex + 1 will be at currentFocusedIndex
      // So we want to navigate to currentFocusedIndex + 1, or wrap to 0 if at end
      const nextIndex = currentFocusedIndex + 1 >= orderedUsers.length ? 0 : currentFocusedIndex + 1;
      const nextUser = orderedUsers[nextIndex];
      
      if (nextUser) {
        // Navigate optimistically to the next user
        if (wasInDetailView) {
          handleOpenUser(nextUser._id);
        } else {
          handleFocusUser(nextUser._id);
        }
      }
    } else if (orderedUsers.length === 1) {
      // This was the last user in current view, need to find next tab
      // Close detail view optimistically
      handleCloseDetail();
    }
    
    // Now refetch and correct if needed
    const result = await refetch();
    const freshUsers = result.data?.users?.results.filter(user => user.needsReview) ?? [];
    
    // Recompute groups and users with fresh data
    const newGroupedUsers = groupBy(freshUsers, user => getUserReviewGroup(user));
    const newOrderedGroups = (Object.entries(newGroupedUsers) as GroupEntry[])
      .sort(([a]: GroupEntry, [b]: GroupEntry) => REVIEW_GROUP_TO_PRIORITY[b] - REVIEW_GROUP_TO_PRIORITY[a]);
    
    const newFilteredGroups = currentTab === 'all'
      ? newOrderedGroups
      : newOrderedGroups.filter(([group]) => group === currentTab);
    
    const newOrderedUsers = newFilteredGroups.map(([_, users]) => users).flat();
    
    // Verify our optimistic update was correct, or correct it
    if (newOrderedUsers.length === 0 && currentTab !== 'all') {
      // Current tab is now empty, switch to next available tab
      const tabsInOrder = getTabsInPriorityOrder();
      let foundTab: ReviewGroup | 'all' = 'all';
      
      for (const group of tabsInOrder) {
        if (newGroupedUsers[group]?.length > 0) {
          foundTab = group;
          break;
        }
      }
      
      setActiveTab(foundTab);
      
      // Get users for the new tab
      const nextTabGroups = foundTab === 'all'
        ? newOrderedGroups
        : newOrderedGroups.filter(([group]) => group === foundTab);
      const nextTabUsers = nextTabGroups.map(([_, users]) => users).flat();
      
      if (nextTabUsers.length > 0) {
        if (wasInDetailView) {
          handleOpenUser(nextTabUsers[0]._id);
        } else {
          handleFocusUser(nextTabUsers[0]._id);
        }
      }
    } else if (newOrderedUsers.length === 0) {
      // No users left at all - make sure we're in inbox view
      if (wasInDetailView) {
        handleCloseDetail();
      }
    }
  }, [refetch, activeTab, focusedIndex, openedUserId, orderedUsers, handleOpenUser, handleFocusUser, handleCloseDetail]);

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

  // Don't render until we have initialized the active tab
  if (activeTab === null) {
    return (
      <div className={classes.loading}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <ModerationKeyboardHandler
        onNextUser={handleNextUser}
        onPrevUser={handlePrevUser}
        onNextTab={handleNextTab}
        onPrevTab={handlePrevTab}
        onOpenDetail={() => {
          if (focusedUserId && !openedUserId) {
            handleOpenUser(focusedUserId);
          } else if (!focusedUserId && orderedUsers.length > 0) {
            handleOpenUser(orderedUsers[0]._id);
          }
        }}
        onCloseDetail={handleCloseDetail}
        selectedUser={sidebarUser}
        currentUser={currentUser}
        onActionComplete={handleActionComplete}
        isDetailView={!!openedUserId}
      />
      <div className={classes.mainContent}>
        <div className={classes.leftPanel}>
          {openedUser ? (
            <ModerationDetailView
              user={openedUser}
              currentUser={currentUser}
              onActionComplete={handleActionComplete}
            />
          ) : (
            <ModerationInboxList
              userGroups={filteredGroups}
              focusedUserId={focusedUserId}
              onFocusUser={handleFocusUser}
              onOpenUser={handleOpenUser}
              visibleTabs={visibleTabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}
        </div>
        <div className={classes.sidebar}>
          {sidebarUser && <ModerationSidebar
            user={sidebarUser}
            currentUser={currentUser}
            onActionComplete={handleActionComplete}
          />}
        </div>
      </div>
    </div>
  );
};

export default ModerationInbox;
