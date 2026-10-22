'use client';

import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';
import { getUserReviewGroup, type TabId } from './groupings';
import { compareReviewQueueUsers, REVIEW_GROUPS_IN_PRIORITY_ORDER } from '@/lib/collections/users/reviewGroups';
import type { GroupEntry } from './ModerationInboxList';
import type { TabInfo } from './ModerationTabs';
import type { SelectedSidebarTab } from './sidebarTabs';
import { isTeamInboxThreadOpen, mergeDoneTeamInboxThreads, sortDoneTeamInboxThreads, sortOpenTeamInboxThreads, type TeamInboxThread } from './teamInboxThreads';
import type { ModerationQueueSnapshot, UnloadedCounts } from './moderationQueue';

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
  // View context of the action, so undo can return there
  sourceTab: TabId;
  wasDetailView: boolean;
};

export interface InboxState extends ModerationQueueSnapshot {
  // The local copy of curation candidate posts
  curationPosts: SunshineCurationPostsListItem[];
  // The local copy of moderator conversations that need a moderator (including rejection appeals)
  teamInboxThreads: TeamInboxThread[];
  // Moderator conversations that are done, loaded only while they're shown
  doneTeamInboxThreads: TeamInboxThread[];
  // Whether the inbox tab also lists done conversations
  showDoneTeamInboxThreads: boolean;
  // The local copy of open reports of flagged content
  reports: UnclaimedReportsList[];
  // The local copy of wikitags awaiting review
  tags: SunshineTagFragment[];
  // Current active tab
  activeTab: TabId;
  // Focused user in inbox view
  focusedUserId: string | null;
  // Opened user in detail view
  openedUserId: string | null;
  // Focused post in inbox view (posts don't have detail view)
  focusedPostId: string | null;
  // Conversation ID of the focused team inbox thread
  focusedThreadId: string | null;
  // Focused report in the flagged content tab
  focusedReportId: string | null;
  // Focused tag in the wikitags tab
  focusedTagId: string | null;
  // Index of focused content item in detail view
  focusedContentIndex: number;
  // Which composer is open in the moderation sidebar, or null for neither
  sidebarTab: SelectedSidebarTab;
  rejectComposerFocusToken?: number;
  // Undo queue - actions that can be undone (within 30 seconds) - only for users
  undoQueue: UndoHistoryItem[];
  // History - expired actions that can't be undone - only for users
  history: HistoryItem[];
  // Document ID for which an LLM detection check is currently running
  runningLlmCheckId: string | null;
}

interface InitialInboxData {
  queue: ModerationQueueSnapshot;
  curationPosts: SunshineCurationPostsListItem[];
  teamInboxThreads: TeamInboxThread[];
  reports: UnclaimedReportsList[];
  tags: SunshineTagFragment[];
  initialOpenedUserId: string | null;
}

export function createInitialInboxState({ queue, curationPosts, teamInboxThreads, reports, tags, initialOpenedUserId }: InitialInboxData): InboxState {
  const state: InboxState = {
    ...queue,
    curationPosts,
    teamInboxThreads,
    doneTeamInboxThreads: [],
    showDoneTeamInboxThreads: false,
    reports,
    tags,
    activeTab: 'curation',
    focusedUserId: null,
    openedUserId: null,
    focusedPostId: null,
    focusedThreadId: null,
    focusedReportId: null,
    focusedTagId: null,
    focusedContentIndex: 0,
    sidebarTab: null,
    undoQueue: [],
    history: [],
    runningLlmCheckId: null,
  };
  if (initialOpenedUserId) {
    return { ...state, activeTab: 'all', focusedUserId: initialOpenedUserId, openedUserId: initialOpenedUserId };
  }
  if (!queue.users.length && !queue.posts.length && !queue.classifiedPosts.length && !curationPosts.length && !teamInboxThreads.length && !reports.length && !tags.length) {
    return state;
  }

  const groupedUsers = groupBy(queue.users, user => getUserReviewGroup(user));
  const curationNoticeCount = sumBy(curationPosts, post => post.curationNotices?.length ?? 0);
  // Only loaded items can be selected. Default to curation when it has no notices.
  const visibleTabs = getVisibleTabsInOrder(groupedUsers, queue.users.length, queue.posts.length, queue.classifiedPosts.length, curationNoticeCount, teamInboxThreads.length, reports.length, tags.length, {});
  const firstQueueTab = curationNoticeCount > 0
    ? visibleTabs.find(tab => tab.group !== 'curation' && tab.count > 0)?.group
    : undefined;
  return enterTab(state, firstQueueTab ?? 'curation');
}

export type InboxAction =
  | { type: 'OPEN_USER'; userId: string; fromUrl?: boolean; }
  | { type: 'LOAD_LINKED_USER'; user: SunshineUsersList; unloadedGroup: ReviewGroup | null; }
  | { type: 'CLOSE_DETAIL'; }
  | { type: 'CHANGE_TAB'; tab: TabId; }
  | { type: 'NEXT_USER'; }
  | { type: 'PREV_USER'; }
  | { type: 'NEXT_POST'; }
  | { type: 'PREV_POST'; }
  | { type: 'FOCUS_POST'; postId: string; }
  | { type: 'FOCUS_THREAD'; conversationId: string; }
  | { type: 'NEXT_THREAD'; }
  | { type: 'PREV_THREAD'; }
  | { type: 'UPDATE_THREAD'; thread: TeamInboxThread; advanceFocus: boolean; }
  | { type: 'SET_DONE_THREADS'; conversations: DoneTeamInboxConversation[]; }
  | { type: 'SET_SHOW_DONE_THREADS'; show: boolean; }
  | { type: 'FOCUS_REPORT'; reportId: string; }
  | { type: 'NEXT_REPORT'; }
  | { type: 'PREV_REPORT'; }
  | { type: 'REMOVE_REPORT'; reportId: string; }
  | { type: 'FOCUS_TAG'; tagId: string; }
  | { type: 'NEXT_TAG'; }
  | { type: 'PREV_TAG'; }
  | { type: 'REMOVE_TAG'; tagId: string; }
  | { type: 'NEXT_TAB'; }
  | { type: 'PREV_TAB'; }
  | { type: 'REMOVE_USER'; userId: string; }
  | { type: 'REMOVE_POST'; postId: string; }
  | { type: 'NEXT_CONTENT'; contentLength: number; }
  | { type: 'PREV_CONTENT'; contentLength: number; }
  | { type: 'OPEN_CONTENT'; contentIndex: number; sidebarTab?: SelectedSidebarTab; }
  | { type: 'FOCUS_REJECT_COMPOSER' }
  | { type: 'SET_SIDEBAR_TAB'; tab: SelectedSidebarTab; }
  | { type: 'UPDATE_USER'; userId: string; fields: Partial<SunshineUsersList>; }
  | { type: 'UPDATE_POST'; postId: string; fields: Partial<SunshinePostsList>; }
  | { type: 'ADD_TO_UNDO_QUEUE'; item: UndoHistoryItem; }
  | { type: 'UNDO_ACTION'; userId: string; }
  | { type: 'EXPIRE_UNDO_ITEM'; userId: string; }
  | { type: 'SET_LLM_CHECK_RUNNING'; documentId: string | null; }
  | { type: 'ADD_LOADED_ITEMS'; snapshot: ModerationQueueSnapshot; };

export function getOrderedGroups(groupedUsers: Partial<Record<ReviewGroup, SunshineUsersList[]>>): GroupEntry[] {
  return REVIEW_GROUPS_IN_PRIORITY_ORDER.flatMap<GroupEntry>(group => {
    const users = groupedUsers[group];
    return users ? [[group, [...users].sort(compareReviewQueueUsers)]] : [];
  });
}

export function getFilteredGroups(
  groupedUsers: Partial<Record<ReviewGroup, SunshineUsersList[]>>,
  activeTab: TabId
): GroupEntry[] {
  const orderedGroups = getOrderedGroups(groupedUsers);
  
  if (activeTab === 'all') {
    return orderedGroups;
  }
  return orderedGroups.filter(([group]) => group === activeTab);
}

export function getVisibleTabsInOrder(
  groupedUsers: Partial<Record<ReviewGroup, SunshineUsersList[]>>,
  totalUsers: number,
  totalPosts: number,
  totalClassifiedPosts: number,
  totalCurationNotices: number,
  totalTeamInboxThreads: number,
  totalReports: number,
  totalTags: number,
  unloadedCounts: UnloadedCounts,
): TabInfo[] {
  const tabs: TabInfo[] = [{ group: 'curation', count: totalCurationNotices }];
  
  // Always show all tabs, even if empty
  for (const group of REVIEW_GROUPS_IN_PRIORITY_ORDER) {
    const count = groupedUsers[group]?.length ?? 0;
    tabs.push({ group, count });
  }
  tabs.push({ group: 'all', count: totalUsers });
  tabs.push({ group: 'posts', count: totalPosts });
  tabs.push({ group: 'classifiedPosts', count: totalClassifiedPosts });
  tabs.push({ group: 'inbox', count: totalTeamInboxThreads });
  tabs.push({ group: 'reports', count: totalReports });
  tabs.push({ group: 'tags', count: totalTags });
  
  return tabs.map(tab => ({ ...tab, count: tab.count + (unloadedCounts[tab.group] ?? 0) }));
}

const NON_USER_TABS: ReadonlySet<TabId> = new Set<TabId>(['posts', 'classifiedPosts', 'curation', 'inbox', 'reports', 'tags']);

/** The ID after (or before) the focused one, wrapping around the ends of the list */
function getAdjacentId(ids: string[], focusedId: string | null, direction: 1 | -1): string | null {
  if (ids.length === 0) return null;
  const focusedIndex = focusedId ? ids.indexOf(focusedId) : -1;
  if (focusedIndex === -1) {
    return direction === 1 ? ids[0] : ids[ids.length - 1];
  }
  return ids[(focusedIndex + direction + ids.length) % ids.length];
}

/**
 * Removes an item, moving focus to the item that takes its place (wrapping to
 * the start of the list) if the removed item was the focused one.
 */
function removeAndRefocus<T extends { _id: string }>(items: T[], removedId: string, focusedId: string | null): { items: T[]; focusedId: string | null } {
  const remainingItems = items.filter(item => item._id !== removedId);
  if (focusedId !== removedId) {
    return { items: remainingItems, focusedId };
  }
  const removedIndex = items.findIndex(item => item._id === removedId);
  const nextFocusedItem = remainingItems[removedIndex] ?? remainingItems[0];
  return { items: remainingItems, focusedId: nextFocusedItem?._id ?? null };
}

export function getVisibleTeamInboxThreads(state: InboxState): TeamInboxThread[] {
  return state.showDoneTeamInboxThreads
    ? [...state.teamInboxThreads, ...state.doneTeamInboxThreads]
    : state.teamInboxThreads;
}

export function isUserTab(tab: TabId): boolean {
  return !NON_USER_TABS.has(tab);
}

export function enterTab(state: InboxState, tab: TabId): InboxState {
  const unfocused = {
    ...state,
    activeTab: tab,
    focusedUserId: null,
    focusedPostId: null,
    focusedThreadId: null,
    focusedReportId: null,
    focusedTagId: null,
    focusedContentIndex: 0,
  };
  switch (tab) {
    case 'posts':
      return { ...unfocused, focusedPostId: state.posts[0]?._id ?? null };
    case 'classifiedPosts':
      return { ...unfocused, focusedPostId: state.classifiedPosts[0]?._id ?? null };
    case 'curation':
      return { ...unfocused, focusedPostId: state.curationPosts[0]?._id ?? null };
    case 'inbox':
      return { ...unfocused, focusedThreadId: state.teamInboxThreads[0]?.conversation._id ?? null };
    case 'reports':
      return { ...unfocused, focusedReportId: state.reports[0]?._id ?? null };
    case 'tags':
      return { ...unfocused, focusedTagId: state.tags[0]?._id ?? null };
    default: {
      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const orderedUsers = getFilteredGroups(groupedUsers, tab).flatMap(([_, users]) => users);
      return { ...unfocused, focusedUserId: orderedUsers[0]?._id ?? null };
    }
  }
}

/**
 * Actions that close the open composer, so an editor never silently holds
 * focus and swallows the moderation shortcuts. Mid-draft actions (permission
 * toggles, LLM checks, undo bookkeeping) are deliberately absent, as is
 * OPEN_CONTENT, which sets `sidebarTab` itself.
 */
const SIDEBAR_TAB_CLEARING_ACTIONS: ReadonlySet<InboxAction['type']> = new Set([
  'OPEN_USER', 'CLOSE_DETAIL', 'NEXT_CONTENT', 'PREV_CONTENT',
  'NEXT_USER', 'PREV_USER', 'CHANGE_TAB', 'NEXT_TAB', 'PREV_TAB',
  'REMOVE_USER', 'UNDO_ACTION',
]);

export function inboxStateReducer(state: InboxState, action: InboxAction): InboxState {
  const newState = reduceInboxAction(state, action);
  if (!SIDEBAR_TAB_CLEARING_ACTIONS.has(action.type) || (newState.sidebarTab === null && !newState.rejectComposerFocusToken)) {
    return newState;
  }
  return { ...newState, sidebarTab: null, rejectComposerFocusToken: 0 };
}

function reduceInboxAction(state: InboxState, action: InboxAction): InboxState {
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
        // A direct link may have loaded this user again while the action was pending.
        users: [...state.users.filter(user => user._id !== item.user._id), item.user],
        undoQueue: state.undoQueue.filter(item => item.user._id !== action.userId),
        activeTab: item.sourceTab,
        focusedUserId: item.user._id,
        openedUserId: item.wasDetailView ? item.user._id : null,
        focusedPostId: null,
        focusedContentIndex: 0,
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
        activeTab: action.fromUrl ? 'all' : state.activeTab,
        focusedUserId: action.fromUrl ? action.userId : state.focusedUserId,
        focusedContentIndex: 0, // Start at first content item
      };
    }

    case 'LOAD_LINKED_USER': {
      const { user, unloadedGroup } = action;
      if (state.openedUserId !== user._id || state.users.some(existing => existing._id === user._id)) return state;
      const wasUnloaded = unloadedGroup && !state.loadedUserIds.includes(user._id);
      return {
        ...state,
        users: [user, ...state.users],
        loadedUserIds: [...new Set([...state.loadedUserIds, user._id])],
        unloadedCounts: wasUnloaded ? {
          ...state.unloadedCounts,
          all: Math.max(0, (state.unloadedCounts.all ?? 0) - 1),
          [unloadedGroup]: Math.max(0, (state.unloadedCounts[unloadedGroup] ?? 0) - 1),
        } : state.unloadedCounts,
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
        // Closes the composer, unless the caller is opening one — the row's
        // Reject button selects the row and opens the reject tab in one action
        sidebarTab: action.sidebarTab ?? null,
        rejectComposerFocusToken: 0,
      };
    }

    case 'FOCUS_REJECT_COMPOSER': {
      return { ...state, sidebarTab: 'reject', rejectComposerFocusToken: (state.rejectComposerFocusToken ?? 0) + 1 };
    }

    case 'SET_SIDEBAR_TAB': {
      return {
        ...state,
        sidebarTab: action.tab,
        rejectComposerFocusToken: 0,
      };
    }

    case 'ADD_LOADED_ITEMS': {
      const { snapshot } = action;
      const knownUserIds = new Set(state.loadedUserIds);
      const knownPostIds = new Set(state.loadedPostIds);
      const users = [...state.users, ...snapshot.users.filter(user => !knownUserIds.has(user._id))];
      const posts = [...state.posts, ...snapshot.posts.filter(post => !knownPostIds.has(post._id))];
      const classifiedPosts = [...state.classifiedPosts, ...snapshot.classifiedPosts.filter(post => !knownPostIds.has(post._id))];

      const firstUserInTab = getFilteredGroups(groupBy(users, user => getUserReviewGroup(user)), state.activeTab)
        .flatMap(([_, groupUsers]) => groupUsers)[0];
      const firstPostInTab = state.activeTab === 'posts' ? posts[0] : state.activeTab === 'classifiedPosts' ? classifiedPosts[0] : undefined;

      return {
        ...state,
        users,
        posts,
        classifiedPosts,
        loadedUserIds: [...new Set([...state.loadedUserIds, ...snapshot.loadedUserIds])],
        loadedPostIds: [...new Set([...state.loadedPostIds, ...snapshot.loadedPostIds])],
        unloadedCounts: snapshot.unloadedCounts,
        focusedUserId: state.focusedUserId ?? (isUserTab(state.activeTab) && !state.openedUserId ? firstUserInTab?._id ?? null : null),
        focusedPostId: state.focusedPostId ?? firstPostInTab?._id ?? null,
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
      return enterTab(state, action.tab);
    }

    case 'NEXT_USER': {
      if (!isUserTab(state.activeTab)) return state;

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
      if (!isUserTab(state.activeTab)) return state;

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
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, state.users.length, state.posts.length, state.classifiedPosts.length, curationNoticeCount, state.teamInboxThreads.length, state.reports.length, state.tags.length, state.unloadedCounts);

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
      return enterTab(state, nextTab);
    }

    case 'PREV_TAB': {
      if (state.openedUserId) return state;

      const groupedUsers = groupBy(state.users, user => getUserReviewGroup(user));
      const curationNoticeCount = sumBy(state.curationPosts, p => p.curationNotices?.length ?? 0);
      const visibleTabs = getVisibleTabsInOrder(groupedUsers, state.users.length, state.posts.length, state.classifiedPosts.length, curationNoticeCount, state.teamInboxThreads.length, state.reports.length, state.tags.length, state.unloadedCounts);

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
      return enterTab(state, prevTab);
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

      if (!isUserTab(state.activeTab)) {
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
      let nextTab: ReviewGroup | 'all' = 'all';

      for (const group of REVIEW_GROUPS_IN_PRIORITY_ORDER) {
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

    case 'FOCUS_THREAD': {
      return {
        ...state,
        focusedThreadId: action.conversationId,
      };
    }

    case 'NEXT_THREAD': {
      const threads = getVisibleTeamInboxThreads(state);
      if (threads.length === 0) return state;

      const currentIndex = threads.findIndex(t => t.conversation._id === state.focusedThreadId);
      const nextIndex = (currentIndex + 1) % threads.length;
      return { ...state, focusedThreadId: threads[nextIndex].conversation._id };
    }

    case 'PREV_THREAD': {
      const threads = getVisibleTeamInboxThreads(state);
      if (threads.length === 0) return state;

      const currentIndex = threads.findIndex(t => t.conversation._id === state.focusedThreadId);
      const prevIndex = currentIndex <= 0 ? threads.length - 1 : currentIndex - 1;
      return { ...state, focusedThreadId: threads[prevIndex].conversation._id };
    }

    case 'UPDATE_THREAD': {
      // Moves the thread between the open and done lists to match its new state
      const conversationId = action.thread.conversation._id;
      const openIndex = state.teamInboxThreads.findIndex(t => t.conversation._id === conversationId);
      const otherOpenThreads = state.teamInboxThreads.filter(t => t.conversation._id !== conversationId);
      const otherDoneThreads = state.doneTeamInboxThreads.filter(t => t.conversation._id !== conversationId);
      const isOpen = isTeamInboxThreadOpen(action.thread);
      const nextOpenThread = otherOpenThreads[Math.min(Math.max(openIndex, 0), otherOpenThreads.length - 1)];
      const leftOpenList = openIndex >= 0 && !isOpen;
      return {
        ...state,
        teamInboxThreads: isOpen ? sortOpenTeamInboxThreads([...otherOpenThreads, action.thread]) : otherOpenThreads,
        doneTeamInboxThreads: isOpen ? otherDoneThreads : sortDoneTeamInboxThreads([action.thread, ...otherDoneThreads]),
        focusedThreadId: (action.advanceFocus && leftOpenList)
          ? (nextOpenThread?.conversation._id ?? null)
          : state.focusedThreadId,
      };
    }

    case 'SET_DONE_THREADS': {
      return {
        ...state,
        doneTeamInboxThreads: mergeDoneTeamInboxThreads(action.conversations, state.doneTeamInboxThreads, state.teamInboxThreads),
      };
    }

    case 'SET_SHOW_DONE_THREADS': {
      return {
        ...state,
        showDoneTeamInboxThreads: action.show,
        focusedThreadId: !action.show && state.doneTeamInboxThreads.some(thread => thread.conversation._id === state.focusedThreadId)
          ? state.teamInboxThreads[0]?.conversation._id ?? null
          : state.focusedThreadId,
      };
    }

    case 'FOCUS_REPORT': {
      return { ...state, focusedReportId: action.reportId };
    }

    case 'NEXT_REPORT': {
      if (state.reports.length === 0) return state;
      return { ...state, focusedReportId: getAdjacentId(state.reports.map(r => r._id), state.focusedReportId, 1) };
    }

    case 'PREV_REPORT': {
      if (state.reports.length === 0) return state;
      return { ...state, focusedReportId: getAdjacentId(state.reports.map(r => r._id), state.focusedReportId, -1) };
    }

    case 'REMOVE_REPORT': {
      const { items: reports, focusedId: focusedReportId } = removeAndRefocus(state.reports, action.reportId, state.focusedReportId);
      return { ...state, reports, focusedReportId };
    }

    case 'FOCUS_TAG': {
      return { ...state, focusedTagId: action.tagId };
    }

    case 'NEXT_TAG': {
      if (state.tags.length === 0) return state;
      return { ...state, focusedTagId: getAdjacentId(state.tags.map(t => t._id), state.focusedTagId, 1) };
    }

    case 'PREV_TAG': {
      if (state.tags.length === 0) return state;
      return { ...state, focusedTagId: getAdjacentId(state.tags.map(t => t._id), state.focusedTagId, -1) };
    }

    case 'REMOVE_TAG': {
      const { items: tags, focusedId: focusedTagId } = removeAndRefocus(state.tags, action.tagId, state.focusedTagId);
      return { ...state, tags, focusedTagId };
    }

    case 'SET_LLM_CHECK_RUNNING': {
      return {
        ...state,
        runningLlmCheckId: action.documentId,
      };
    }

    default:
      return state;
  }
}
