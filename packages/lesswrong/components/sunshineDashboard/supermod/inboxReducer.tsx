'use client';

import groupBy from 'lodash/groupBy';
import { getUserReviewGroup, getTabsInPriorityOrder, type ReviewGroup, REVIEW_GROUP_TO_PRIORITY } from './groupings';
import type { GroupEntry } from './ModerationInboxList';
import type { TabInfo } from './ModerationTabs';

export interface HistoryItem {
  user: SunshineUsersList;
  actionLabel: string;
  timestamp: number;
}

export interface UndoHistoryItem {
  user: SunshineUsersList;
  actionLabel: string;
  timestamp: number;
  expiresAt: number;
  timeoutId: NodeJS.Timeout;
  executeAction: () => Promise<void>;
};


export type InboxState = {
  // The local copy of users (mutated when actions complete)
  users: SunshineUsersList[];
  // The local copy of posts (mutated when actions complete)
  posts: SunshinePostsList[];
  // Current active tab
  activeTab: ReviewGroup | 'all' | 'posts';
  // Focused user in inbox view
  focusedUserId: string | null;
  // Opened user in detail view
  openedUserId: string | null;
  // Focused post in inbox view (posts don't have detail view)
  focusedPostId: string | null;
  // Index of focused content item in detail view
  focusedContentIndex: number;
  // Undo queue - actions that can be undone (within 30 seconds) - only for users
  undoQueue: UndoHistoryItem[];
  // History - expired actions that can't be undone - only for users
  history: HistoryItem[];
};

export type InboxAction =
  | { type: 'OPEN_USER'; userId: string; }
  | { type: 'CLOSE_DETAIL'; }
  | { type: 'CHANGE_TAB'; tab: ReviewGroup | 'all' | 'posts'; }
  | { type: 'NEXT_USER'; }
  | { type: 'PREV_USER'; }
  | { type: 'NEXT_POST'; }
  | { type: 'PREV_POST'; }
  | { type: 'FOCUS_POST'; postId: string; }
  | { type: 'NEXT_TAB'; }
  | { type: 'PREV_TAB'; }
  | { type: 'REMOVE_USER'; userId: string; }
  | { type: 'REMOVE_POST'; postId: string; }
  | { type: 'NEXT_CONTENT'; contentLength: number; }
  | { type: 'PREV_CONTENT'; contentLength: number; }
  | { type: 'OPEN_CONTENT'; contentIndex: number; }
  | { type: 'UPDATE_USER'; userId: string; fields: Partial<SunshineUsersList>; }
  | { type: 'UPDATE_POST'; postId: string; fields: Partial<SunshinePostsList>; }
  | { type: 'ADD_TO_UNDO_QUEUE'; item: UndoHistoryItem; }
  | { type: 'UNDO_ACTION'; userId: string; }
  | { type: 'EXPIRE_UNDO_ITEM'; userId: string; };



export function getFilteredGroups(
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

export function getVisibleTabsInOrder(
  groupedUsers: Partial<Record<ReviewGroup, SunshineUsersList[]>>,
  totalUsers: number,
  totalPosts: number,
): TabInfo[] {
  const tabsInOrder = getTabsInPriorityOrder();
  const tabs: TabInfo[] = [];
  
  // Always show all tabs, even if empty
  for (const group of tabsInOrder) {
    const count = groupedUsers[group]?.length ?? 0;
    tabs.push({ group, count });
  }
  
  tabs.push({ group: 'all', count: totalUsers });
  tabs.push({ group: 'posts', count: totalPosts });
  
  return tabs;
}

export function inboxStateReducer(state: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case 'ADD_TO_UNDO_QUEUE': {
      return {
        ...state,
        undoQueue: [...state.undoQueue, action.item],
      };
    }

    case 'UNDO_ACTION': {
      const item = state.undoQueue.find(item => item.user._id === action.userId);
      if (!item) return state;

      if (item.timeoutId) {
        clearTimeout(item.timeoutId);
      }

      return {
        ...state,
        users: [...state.users, item.user],
        undoQueue: state.undoQueue.filter(item => item.user._id !== action.userId),
      };
    }

    case 'EXPIRE_UNDO_ITEM': {
      const item = state.undoQueue.find(item => item.user._id === action.userId);
      if (!item) return state;

      // Note: The action execution itself happens in the component via the timeout callback
      return {
        ...state,
        undoQueue: state.undoQueue.filter(item => item.user._id !== action.userId),
        history: [...state.history, item],
      };
    }

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

    case 'OPEN_CONTENT': {
      return {
        ...state,
        focusedContentIndex: action.contentIndex,
      };
    }

    case 'UPDATE_USER': {
      const updatedUsers = state.users.map(user => user._id === action.userId
        ? { ...user, ...action.fields }
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

      // Switching to posts tab
      if (action.tab === 'posts') {
        return {
          ...state,
          activeTab: 'posts',
          focusedPostId: state.posts[0]?._id ?? null,
          focusedUserId: null,
          focusedContentIndex: 0,
        };
      }

      // Switching to a user tab
      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const filteredGroups = getFilteredGroups(groupedUsers, action.tab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);

      return {
        ...state,
        activeTab: action.tab,
        focusedUserId: orderedUsers[0]?._id ?? null,
        focusedPostId: null,
        focusedContentIndex: 0,
      };
    }

    case 'NEXT_USER': {
      // Don't navigate users when on posts tab
      if (state.activeTab === 'posts') return state;

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
      // Don't navigate users when on posts tab
      if (state.activeTab === 'posts') return state;

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
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, state.users.length, state.posts.length);

      if (visibleTabs.length === 0) return state;

      const currentIndex = visibleTabs.findIndex(tab => tab.group === state.activeTab);
      
      // Find next non-empty tab
      let nextIndex = (currentIndex + 1) % visibleTabs.length;
      let attempts = 0;
      while (visibleTabs[nextIndex].count === 0 && attempts < visibleTabs.length) {
        nextIndex = (nextIndex + 1) % visibleTabs.length;
        attempts++;
      }
      
      // If all tabs are empty, stay on current tab
      if (attempts >= visibleTabs.length) return state;
      
      const nextTab = visibleTabs[nextIndex].group;

      // If switching to posts tab
      if (nextTab === 'posts') {
        return {
          ...state,
          activeTab: 'posts',
          focusedPostId: state.posts[0]?._id ?? null,
          focusedUserId: null,
          focusedContentIndex: 0,
        };
      }

      // Switching to a user tab
      const filteredGroups = getFilteredGroups(groupedUsers, nextTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);

      return {
        ...state,
        activeTab: nextTab,
        focusedUserId: orderedUsers[0]?._id ?? null,
        focusedPostId: null,
        focusedContentIndex: 0,
      };
    }

    case 'PREV_TAB': {
      if (state.openedUserId) return state;

      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, state.users.length, state.posts.length);

      if (visibleTabs.length === 0) return state;

      const currentIndex = visibleTabs.findIndex(tab => tab.group === state.activeTab);
      
      // Find previous non-empty tab
      let prevIndex = currentIndex <= 0 ? visibleTabs.length - 1 : currentIndex - 1;
      let attempts = 0;
      while (visibleTabs[prevIndex].count === 0 && attempts < visibleTabs.length) {
        prevIndex = prevIndex <= 0 ? visibleTabs.length - 1 : prevIndex - 1;
        attempts++;
      }
      
      // If all tabs are empty, stay on current tab
      if (attempts >= visibleTabs.length) return state;
      
      const prevTab = visibleTabs[prevIndex].group;

      // If switching to posts tab
      if (prevTab === 'posts') {
        return {
          ...state,
          activeTab: 'posts',
          focusedPostId: state.posts[0]?._id ?? null,
          focusedUserId: null,
          focusedContentIndex: 0,
        };
      }

      // Switching to a user tab
      const filteredGroups = getFilteredGroups(groupedUsers, prevTab);
      const orderedUsers = filteredGroups.flatMap(([_, users]) => users);

      return {
        ...state,
        activeTab: prevTab,
        focusedUserId: orderedUsers[0]?._id ?? null,
        focusedPostId: null,
        focusedContentIndex: 0,
      };
    }

    case 'UPDATE_POST': {
      const updatedPosts = state.posts.map(post => post._id === action.postId
        ? { ...post, ...action.fields }
        : post
      );
      return {
        ...state,
        posts: updatedPosts,
      };
    }

    case 'NEXT_POST': {
      if (state.posts.length === 0) return state;

      const currentIndex = state.posts.findIndex(p => p._id === state.focusedPostId);
      const nextIndex = (currentIndex + 1) % state.posts.length;
      const nextPostId = state.posts[nextIndex]._id;

      return { ...state, focusedPostId: nextPostId };
    }

    case 'PREV_POST': {
      if (state.posts.length === 0) return state;

      const currentIndex = state.posts.findIndex(p => p._id === state.focusedPostId);
      const prevIndex = currentIndex <= 0 ? state.posts.length - 1 : currentIndex - 1;
      const prevPostId = state.posts[prevIndex]._id;

      return { ...state, focusedPostId: prevPostId };
    }

    case 'FOCUS_POST': {
      return {
        ...state,
        focusedPostId: action.postId,
      };
    }

    case 'REMOVE_POST': {
      const newPosts = state.posts.filter(p => p._id !== action.postId);

      if (newPosts.length === 0) {
        return {
          ...state,
          posts: [],
          focusedPostId: null,
        };
      }

      const currentIndex = state.posts.findIndex(p => p._id === state.focusedPostId);
      const nextIndex = currentIndex >= newPosts.length ? 0 : Math.max(0, currentIndex);
      const nextPostId = newPosts[nextIndex]._id;

      return {
        ...state,
        posts: newPosts,
        focusedPostId: nextPostId,
      };
    }

    case 'REMOVE_USER': {
      const newUsers = state.users.filter(u => u._id !== action.userId);

      if (newUsers.length === 0) {
        return {
          ...state,
          users: [],
          activeTab: 'all',
          focusedUserId: null,
          openedUserId: null,
          focusedContentIndex: 0,
        };
      }

      // If we're on posts tab, just remove the user without changing focus
      if (state.activeTab === 'posts') {
        return {
          ...state,
          users: newUsers,
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
            ...state,
            users: newUsers,
            focusedUserId: null,
            openedUserId: nextUserId,
            focusedContentIndex: 0,
          };
        } else {
          return {
            ...state,
            users: newUsers,
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
          ...state,
          users: newUsers,
          activeTab: nextTab,
          focusedUserId: nextUserId,
          openedUserId: null,
          focusedContentIndex: 0,
        };
      }

      // Fallback: no users anywhere
      return {
        ...state,
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

