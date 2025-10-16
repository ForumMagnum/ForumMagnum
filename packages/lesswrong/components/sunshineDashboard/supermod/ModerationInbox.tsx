'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getUserReviewGroup, REVIEW_GROUP_TO_PRIORITY } from './groupings';

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
    overflow: 'auto',
    borderLeft: theme.palette.border.normal,
    backgroundColor: theme.palette.background.paper,
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

  const orderedUsers = useMemo(() => orderedGroups.map(([_, users]) => users).flat(), [orderedGroups]);

  // Auto-focus first user when data loads
  useEffect(() => {
    if (orderedUsers.length > 0 && !focusedUserId && !openedUserId) {
      setFocusedUserId(orderedUsers[0]._id);
    }
  }, [orderedUsers, focusedUserId, openedUserId]);

  const openedUser = useMemo(() => {
    if (!openedUserId) return null;
    return orderedUsers.find(u => u._id === openedUserId) ?? null;
  }, [openedUserId, orderedUsers]);

  // In inbox view, show focused user in sidebar
  // In detail view, show opened user in sidebar
  const sidebarUser = openedUser || (focusedUserId ? orderedUsers.find(u => u._id === focusedUserId) ?? null : null);

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

  const handleActionComplete = useCallback(async () => {
    await refetch();
    // After refetch, automatically select the next user
    // We need to wait a tick for the query to complete
    setTimeout(() => {
      if (orderedUsers.length > 0) {
        // If we were on the last user, go to the first
        // Otherwise go to the same index (which will be the next user after removal)
        const nextIndex = focusedIndex >= orderedUsers.length - 1 ? 0 : focusedIndex;
        if (orderedUsers[nextIndex]) {
          if (openedUserId) {
            handleOpenUser(orderedUsers[nextIndex]._id);
          } else {
            handleFocusUser(orderedUsers[nextIndex]._id);
          }
        } else {
          handleCloseDetail();
        }
      } else {
        handleCloseDetail();
      }
    }, 100);
  }, [refetch, orderedUsers, focusedIndex, openedUserId, handleOpenUser, handleFocusUser, handleCloseDetail]);

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

  return (
    <div className={classes.root}>
      <ModerationKeyboardHandler
        onNextUser={handleNextUser}
        onPrevUser={handlePrevUser}
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
              userGroups={orderedGroups}
              focusedUserId={focusedUserId}
              onFocusUser={handleFocusUser}
              onOpenUser={handleOpenUser}
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
