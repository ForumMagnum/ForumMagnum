'use client';

import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { getUserReviewGroup, getTabsInPriorityOrder, type ReviewGroup, type TabId, REVIEW_GROUP_TO_PRIORITY } from './groupings';
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
  // The local copy of auto-classified posts (mutated when actions complete)
  classifiedPosts: SunshinePostsList[];
  // The local copy of curation candidate posts
  curationPosts: SunshineCurationPostsListItem[];
  // Per-list hydration flags. Each list starts unhydrated; HYDRATE_LISTS sets it
  // once when the corresponding query resolves. After that, the reducer ignores
  // further hydrations so local mutations (e.g. REMOVE_USER) aren't clobbered.
  hydratedUsers: boolean;
  hydratedPosts: boolean;
  hydratedClassifiedPosts: boolean;
  hydratedCurationPosts: boolean;
  // True once the user has manually chosen a tab; stops auto-selection on hydration.
  userHasPickedTab: boolean;
  // Current active tab
  activeTab: TabId;
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
  // Document ID for which an LLM detection check is currently running
  runningLlmCheckId: string | null;
};

export type InboxAction =
  | { type: 'OPEN_USER'; userId: string; }
  | { type: 'CLOSE_DETAIL'; }
  | { type: 'CHANGE_TAB'; tab: TabId; }
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
  | { type: 'EXPIRE_UNDO_ITEM'; userId: string; }
  | { type: 'SET_LLM_CHECK_RUNNING'; documentId: string | null; }
  | { type: 'HYDRATE_LISTS';
      users?: SunshineUsersList[];
      posts?: SunshinePostsList[];
      classifiedPosts?: SunshinePostsList[];
      curationPosts?: SunshineCurationPostsListItem[];
    };



export function getFilteredGroups(
  groupedUsers: Partial<Record<ReviewGroup, SunshineUsersList[]>>,
  activeTab: TabId
): GroupEntry[] {
  const orderedGroups = (Object.entries(groupedUsers) as GroupEntry[])
    .sort(([a]: GroupEntry, [b]: GroupEntry) => REVIEW_GROUP_TO_PRIORITY[b] - REVIEW_GROUP_TO_PRIORITY[a]);
  
  if (activeTab === 'all') {
    return orderedGroups;
  }
  return orderedGroups.filter(([group]) => group === activeTab);
}

/**
 * Pick the default active tab and initial focused user/post based on which
 * lists have data. Mirrors what the original initializer used to compute at
 * mount, but is now also called when query data arrives later so the page can
 * mount eagerly with empty lists and settle on a useful default once data
 * lands. Caller is responsible for not invoking this once the user has picked
 * a tab.
 */
export function pickDefaultTabAndFocus(
  users: SunshineUsersList[],
  posts: SunshinePostsList[],
  classifiedPosts: SunshinePostsList[],
  curationPosts: SunshineCurationPostsListItem[],
  initialOpenedUserId: string | null,
): { activeTab: TabId; focusedUserId: string | null; focusedPostId: string | null } {
  if (initialOpenedUserId) {
    return { activeTab: 'all', focusedUserId: initialOpenedUserId, focusedPostId: null };
  }

  const groupedUsers = groupBy(users, user => getUserReviewGroup(user));
  const curationNoticeCount = sumBy(curationPosts, p => p.curationNotices?.length ?? 0);
  const visibleTabs = getVisibleTabsInOrder(groupedUsers, users.length, posts.length, classifiedPosts.length, curationNoticeCount);

  // Default to curation when there are no curation notices (so you can add some).
  // Otherwise, find the first non-empty non-curation tab.
  const firstNonEmptyTab = curationNoticeCount === 0
    ? undefined
    : visibleTabs.find(tab => tab.group !== 'curation' && tab.count > 0);
  const firstTab: TabId = firstNonEmptyTab?.group ?? 'curation';

  if (firstTab === 'curation') {
    return { activeTab: 'curation', focusedUserId: null, focusedPostId: curationPosts[0]?._id ?? null };
  }
  if (firstTab === 'posts') {
    return { activeTab: 'posts', focusedUserId: null, focusedPostId: posts[0]?._id ?? null };
  }
  if (firstTab === 'classifiedPosts') {
    return { activeTab: 'classifiedPosts', focusedUserId: null, focusedPostId: classifiedPosts[0]?._id ?? null };
  }

  const filteredGroups = getFilteredGroups(groupedUsers, firstTab);
  const orderedUsers = filteredGroups.flatMap(([_, users]) => users);
  return { activeTab: firstTab, focusedUserId: orderedUsers[0]?._id ?? null, focusedPostId: null };
}

export function getVisibleTabsInOrder(
  groupedUsers: Partial<Record<ReviewGroup, SunshineUsersList[]>>,
  totalUsers: number,
  totalPosts: number,
  totalClassifiedPosts: number,
  totalCurationNotices: number,
): TabInfo[] {
  const tabsInOrder = getTabsInPriorityOrder();
  const tabs: TabInfo[] = [{ group: 'curation', count: totalCurationNotices }];
  
  // Always show all tabs, even if empty
  for (const group of tabsInOrder) {
    const count = groupedUsers[group]?.length ?? 0;
    tabs.push({ group, count });
  }
  tabs.push({ group: 'all', count: totalUsers });
  tabs.push({ group: 'posts', count: totalPosts });
  tabs.push({ group: 'classifiedPosts', count: totalClassifiedPosts });
  
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
          userHasPickedTab: true,
        };
      }

      // Switching to classified posts tab
      if (action.tab === 'classifiedPosts') {
        return {
          ...state,
          activeTab: 'classifiedPosts',
          focusedPostId: state.classifiedPosts[0]?._id ?? null,
          focusedUserId: null,
          focusedContentIndex: 0,
          userHasPickedTab: true,
        };
      }

      // Switching to curation tab
      if (action.tab === 'curation') {
        return {
          ...state,
          activeTab: 'curation',
          focusedPostId: state.curationPosts[0]?._id ?? null,
          focusedUserId: null,
          focusedContentIndex: 0,
          userHasPickedTab: true,
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
        userHasPickedTab: true,
      };
    }

    case 'NEXT_USER': {
      // Don't navigate users when on posts tab, classified posts tab, or curation tab
      if (state.activeTab === 'posts' || state.activeTab === 'classifiedPosts' || state.activeTab === 'curation') return state;

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
      // Don't navigate users when on posts tab, classified posts tab, or curation tab
      if (state.activeTab === 'posts' || state.activeTab === 'classifiedPosts' || state.activeTab === 'curation') return state;

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
      const curationNoticeCount = sumBy(state.curationPosts, p => p.curationNotices?.length ?? 0);
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, state.users.length, state.posts.length, state.classifiedPosts.length, curationNoticeCount);

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
          userHasPickedTab: true,
        };
      }

      // If switching to classified posts tab
      if (nextTab === 'classifiedPosts') {
        return {
          ...state,
          activeTab: 'classifiedPosts',
          focusedPostId: state.classifiedPosts[0]?._id ?? null,
          focusedUserId: null,
          focusedContentIndex: 0,
          userHasPickedTab: true,
        };
      }

      // If switching to curation tab
      if (nextTab === 'curation') {
        return {
          ...state,
          activeTab: 'curation',
          focusedPostId: state.curationPosts[0]?._id ?? null,
          focusedUserId: null,
          focusedContentIndex: 0,
          userHasPickedTab: true,
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
        userHasPickedTab: true,
      };
    }

    case 'PREV_TAB': {
      if (state.openedUserId) return state;

      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const curationNoticeCount = sumBy(state.curationPosts, p => p.curationNotices?.length ?? 0);
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, state.users.length, state.posts.length, state.classifiedPosts.length, curationNoticeCount);

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
          userHasPickedTab: true,
        };
      }

      // If switching to classified posts tab
      if (prevTab === 'classifiedPosts') {
        return {
          ...state,
          activeTab: 'classifiedPosts',
          focusedPostId: state.classifiedPosts[0]?._id ?? null,
          focusedUserId: null,
          focusedContentIndex: 0,
          userHasPickedTab: true,
        };
      }

      // If switching to curation tab
      if (prevTab === 'curation') {
        return {
          ...state,
          activeTab: 'curation',
          focusedPostId: state.curationPosts[0]?._id ?? null,
          focusedUserId: null,
          focusedContentIndex: 0,
          userHasPickedTab: true,
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
        userHasPickedTab: true,
      };
    }

    case 'UPDATE_POST': {
      const updatedPosts = state.posts.map(post => post._id === action.postId
        ? { ...post, ...action.fields }
        : post
      );
      const updatedClassifiedPosts = state.classifiedPosts.map(post => post._id === action.postId
        ? { ...post, ...action.fields }
        : post
      );
      return {
        ...state,
        posts: updatedPosts,
        classifiedPosts: updatedClassifiedPosts,
      };
    }

    case 'NEXT_POST': {
      const currentPosts = state.activeTab === 'curation' ? state.curationPosts : state.activeTab === 'classifiedPosts' ? state.classifiedPosts : state.posts;
      if (currentPosts.length === 0) return state;

      const currentIndex = currentPosts.findIndex(p => p._id === state.focusedPostId);
      const nextIndex = (currentIndex + 1) % currentPosts.length;
      const nextPostId = currentPosts[nextIndex]._id;

      return { ...state, focusedPostId: nextPostId };
    }

    case 'PREV_POST': {
      const currentPosts = state.activeTab === 'curation' ? state.curationPosts : state.activeTab === 'classifiedPosts' ? state.classifiedPosts : state.posts;
      if (currentPosts.length === 0) return state;

      const currentIndex = currentPosts.findIndex(p => p._id === state.focusedPostId);
      const prevIndex = currentIndex <= 0 ? currentPosts.length - 1 : currentIndex - 1;
      const prevPostId = currentPosts[prevIndex]._id;

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
      const newClassifiedPosts = state.classifiedPosts.filter(p => p._id !== action.postId);

      const currentPosts = state.activeTab === 'classifiedPosts' ? state.classifiedPosts : state.posts;
      const newCurrentPosts = state.activeTab === 'classifiedPosts' ? newClassifiedPosts : newPosts;

      if (newCurrentPosts.length === 0) {
        return {
          ...state,
          posts: newPosts,
          classifiedPosts: newClassifiedPosts,
          focusedPostId: null,
        };
      }

      const currentIndex = currentPosts.findIndex(p => p._id === state.focusedPostId);
      const nextIndex = currentIndex >= newCurrentPosts.length ? 0 : Math.max(0, currentIndex);
      const nextPostId = newCurrentPosts[nextIndex]._id;

      return {
        ...state,
        posts: newPosts,
        classifiedPosts: newClassifiedPosts,
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

      // If we're on posts tab, classified posts tab, or curation tab, just remove the user without changing focus
      if (state.activeTab === 'posts' || state.activeTab === 'classifiedPosts' || state.activeTab === 'curation') {
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

    case 'SET_LLM_CHECK_RUNNING': {
      return {
        ...state,
        runningLlmCheckId: action.documentId,
      };
    }

    case 'HYDRATE_LISTS': {
      // Only accept a list's data the first time it arrives, so we don't clobber
      // local mutations on `cache-and-network` refetches.
      const nextUsers = !state.hydratedUsers && action.users ? action.users : state.users;
      const nextPosts = !state.hydratedPosts && action.posts ? action.posts : state.posts;
      const nextClassifiedPosts = !state.hydratedClassifiedPosts && action.classifiedPosts ? action.classifiedPosts : state.classifiedPosts;
      const nextCurationPosts = !state.hydratedCurationPosts && action.curationPosts ? action.curationPosts : state.curationPosts;

      const nextState: InboxState = {
        ...state,
        users: nextUsers,
        posts: nextPosts,
        classifiedPosts: nextClassifiedPosts,
        curationPosts: nextCurationPosts,
        hydratedUsers: state.hydratedUsers || !!action.users,
        hydratedPosts: state.hydratedPosts || !!action.posts,
        hydratedClassifiedPosts: state.hydratedClassifiedPosts || !!action.classifiedPosts,
        hydratedCurationPosts: state.hydratedCurationPosts || !!action.curationPosts,
      };

      // If the user hasn't picked a tab yet, re-derive the default tab and
      // focused IDs now that more data is in. Once they pick, leave it alone.
      if (!state.userHasPickedTab && !state.openedUserId) {
        const initialOpenedUserId = state.openedUserId;
        const { activeTab, focusedUserId, focusedPostId } = pickDefaultTabAndFocus(
          nextUsers,
          nextPosts,
          nextClassifiedPosts,
          nextCurationPosts,
          initialOpenedUserId,
        );
        nextState.activeTab = activeTab;
        nextState.focusedUserId = focusedUserId;
        nextState.focusedPostId = focusedPostId;
      }

      return nextState;
    }

    default:
      return state;
  }
}
