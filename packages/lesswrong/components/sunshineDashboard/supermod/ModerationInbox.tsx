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
    await refetch();
    // After refetch, automatically select the next user
    // We need to wait a tick for the query to complete
    setTimeout(() => {
      // Check if current tab still has users (recompute with fresh data)
      const newGroupedUsers = groupBy(
        data?.users?.results.filter(user => user.needsReview) ?? [],
        user => getUserReviewGroup(user)
      );
      const newOrderedGroups = (Object.entries(newGroupedUsers) as GroupEntry[])
        .sort(([a]: GroupEntry, [b]: GroupEntry) => REVIEW_GROUP_TO_PRIORITY[b] - REVIEW_GROUP_TO_PRIORITY[a]);
      
      const newFilteredGroups = activeTab === 'all'
        ? newOrderedGroups
        : newOrderedGroups.filter(([group]) => group === activeTab);
      
      const newOrderedUsers = newFilteredGroups.map(([_, users]) => users).flat();
      
      // If current tab is now empty (and not 'all'), switch to next available tab
      if (newOrderedUsers.length === 0 && activeTab !== 'all') {
        // Find next non-empty tab
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
          if (openedUserId) {
            handleOpenUser(nextTabUsers[0]._id);
          } else {
            handleFocusUser(nextTabUsers[0]._id);
          }
        } else {
          handleCloseDetail();
        }
      } else if (newOrderedUsers.length > 0) {
        // Current tab still has users
        // If we were on the last user, go to the first
        // Otherwise go to the same index (which will be the next user after removal)
        const nextIndex = focusedIndex >= newOrderedUsers.length - 1 ? 0 : focusedIndex;
        if (newOrderedUsers[nextIndex]) {
          if (openedUserId) {
            handleOpenUser(newOrderedUsers[nextIndex]._id);
          } else {
            handleFocusUser(newOrderedUsers[nextIndex]._id);
          }
        } else {
          handleCloseDetail();
        }
      } else {
        handleCloseDetail();
      }
    }, 100);
  }, [refetch, data, activeTab, focusedIndex, openedUserId, handleOpenUser, handleFocusUser, handleCloseDetail]);

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
