import { createInitialInboxState, inboxStateReducer, type InboxState, type UndoHistoryItem } from '@/components/sunshineDashboard/supermod/inboxReducer';
import { getModerationQueueSnapshot } from '@/components/sunshineDashboard/supermod/moderationQueue';
import type { ModerationInboxQueueQueryQuery } from '@/lib/generated/gql-codegen/graphql';
import {
  UNREVIEWED_FIRST_POST,
  MANUAL_FLAG_ALERT,
  UNREVIEWED_BIO_UPDATE,
  STRICTER_COMMENT_AUTOMOD_RATE_LIMIT,
  MANUAL_NEEDS_REVIEW,
  SNOOZE_EXPIRED,
} from '../lib/collections/moderatorActions/constants';

const moderatorActionTypes: Record<ReviewGroup, ModeratorActionType> = {
  newContent: UNREVIEWED_FIRST_POST,
  // `offboard` has no moderator action; mocks just need a plausible one.
  offboard: UNREVIEWED_FIRST_POST,
  highContext: MANUAL_FLAG_ALERT,
  maybeSpam: UNREVIEWED_BIO_UPDATE,
  automod: STRICTER_COMMENT_AUTOMOD_RATE_LIMIT,
  snoozeExpired: SNOOZE_EXPIRED,
  unknown: MANUAL_NEEDS_REVIEW,
};

function createMockUser(
  id: string,
  reviewGroup: ReviewGroup,
  partialUser?: Partial<SunshineUsersList>
): SunshineUsersList {
  const baseUser = {
    __typename: 'User' as const,
    _id: id,
    username: `user${id}`,
    displayName: `User ${id}`,
    createdAt: new Date().toISOString(),
    needsReview: true,
    reviewedByUserId: null,
    moderatorActions: [],
    sunshineFlagged: false,
    karma: 0,
    postCount: 0,
    commentCount: 0,
    usersContactedBeforeReview: [],
    rejectedContentCount: 0,
    htmlBio: '',
    lastRemovedFromReviewQueueAt: null,
  };

  return {
    ...baseUser,
    reviewGroup,
    moderatorActions: [{
      __typename: 'ModeratorAction' as const,
      _id: `action-${id}`,
      type: moderatorActionTypes[reviewGroup],
      createdAt: new Date().toISOString(),
      endedAt: null,
      active: true,
      userId: id,
      user: baseUser as unknown as UsersMinimumInfo,
    }],
    ...partialUser,
  } as SunshineUsersList;
}

function createUndoItem(
  user: SunshineUsersList,
  overrides?: Partial<UndoHistoryItem>
): UndoHistoryItem {
  return {
    user,
    actionLabel: 'Approved',
    timestamp: 0,
    expiresAt: 0,
    timeoutId: setTimeout(() => {}, 0),
    executeAction: async () => {},
    sourceTab: 'all',
    wasDetailView: false,
    ...overrides,
  };
}

function createState(state: Omit<InboxState, 'loadedUserIds' | 'loadedPostIds'>): InboxState {
  return {
    ...state,
    loadedUserIds: [...new Set([...state.users, ...state.undoQueue.map(item => item.user), ...state.history.map(item => item.user)].map(user => user._id))],
    loadedPostIds: [...new Set([...state.posts, ...state.classifiedPosts].map(post => post._id))],
  };
}

function createQueueResult(users: SunshineUsersList[], overrides: Partial<ModerationInboxQueueQueryQuery> = {}): ModerationInboxQueueQueryQuery {
  return {
    supermodQueueSnapshotTime: '2026-10-14T12:00:00.000Z',
    users: { results: users },
    reviewQueueUsers: { results: users.map(user => ({ _id: user._id, reviewGroup: user.reviewGroup })) },
    posts: { results: [], totalCount: 0 },
    classifiedPosts: { results: [], totalCount: 0 },
    ...overrides,
  };
}

describe('Moderation Inbox Reducer', () => {
  describe('queue loading', () => {
    test('merges repeatedly without resurrecting moderated users or losing local state', () => {
      const users = ['selected', 'undo', 'history'].map(id => createMockUser(id, 'newContent'));
      let state = createInitialInboxState({ queue: getModerationQueueSnapshot(createQueueResult(users)), curationPosts: [], initialOpenedUserId: 'selected' });
      state = inboxStateReducer(state, { type: 'UPDATE_USER', userId: 'selected', fields: { karma: 123 } });
      for (const user of users.slice(1)) {
        state = inboxStateReducer(state, { type: 'ADD_TO_UNDO_QUEUE', item: createUndoItem(user) });
        state = inboxStateReducer(state, { type: 'REMOVE_USER', userId: user._id });
      }
      state = inboxStateReducer(state, { type: 'EXPIRE_UNDO_ITEM', userId: 'history' });
      state = inboxStateReducer(state, { type: 'SET_SIDEBAR_TAB', tab: 'reject' });
      const snapshot = getModerationQueueSnapshot(createQueueResult([...users, createMockUser('new', 'newContent')]));
      const merged = inboxStateReducer(state, { type: 'ADD_LOADED_ITEMS', snapshot });

      expect(merged.users.map(user => user._id)).toEqual(['selected', 'new']);
      expect(merged.users[0].karma).toBe(123);
      expect(merged.loadedUserIds).toEqual(['selected', 'undo', 'history', 'new']);
      expect(merged.undoQueue).toBe(state.undoQueue);
      expect(merged.history).toBe(state.history);
      expect(merged.openedUserId).toBe('selected');
      expect(merged.focusedUserId).toBe(state.focusedUserId);
      expect(merged.sidebarTab).toBe('reject');
      expect(inboxStateReducer(merged, { type: 'ADD_LOADED_ITEMS', snapshot })).toEqual(merged);
    });

    test('remembers removed items even when they are not in undo or history', () => {
      const user = createMockUser('removed', 'newContent');
      const queue = getModerationQueueSnapshot(createQueueResult([user]));
      let state = createInitialInboxState({ queue, curationPosts: [], initialOpenedUserId: null });
      state = inboxStateReducer(state, { type: 'REMOVE_USER', userId: user._id });
      const merged = inboxStateReducer(state, { type: 'ADD_LOADED_ITEMS', snapshot: queue });
      expect(merged.users).toEqual([]);
      expect(merged.loadedUserIds).toEqual(['removed']);
    });

    test('focuses a newly loaded item when the selected tab was empty', () => {
      const queue = getModerationQueueSnapshot(createQueueResult([]));
      let state = createInitialInboxState({ queue, curationPosts: [], initialOpenedUserId: null });
      state = inboxStateReducer(state, { type: 'CHANGE_TAB', tab: 'newContent' });
      const snapshot = getModerationQueueSnapshot(createQueueResult([createMockUser('new', 'newContent')]));
      const merged = inboxStateReducer(state, { type: 'ADD_LOADED_ITEMS', snapshot });
      expect(merged.activeTab).toBe('newContent');
      expect(merged.focusedUserId).toBe('new');
    });

    test('counts fetched users as loaded even if moderation removed their review flag', () => {
      const reviewed = createMockUser('reviewed', 'newContent', { needsReview: false });
      const missing = createMockUser('missing', 'highContext');
      const queue = getModerationQueueSnapshot(createQueueResult([reviewed], {
        reviewQueueUsers: { results: [reviewed, missing] },
      }));
      expect(queue.users).toEqual([]);
      expect(queue.loadedUserIds).toEqual(['reviewed']);
      expect(queue.unloadedCounts).toEqual({ all: 1, highContext: 1, posts: 0, classifiedPosts: 0 });
    });

    test('refreshes counts from the new response instead of the initial queue totals', () => {
      const initial = getModerationQueueSnapshot(createQueueResult([], { posts: { results: [], totalCount: 100 } }));
      const state = createInitialInboxState({ queue: initial, curationPosts: [], initialOpenedUserId: null });
      const refreshed = getModerationQueueSnapshot(createQueueResult([]));
      const merged = inboxStateReducer(state, { type: 'ADD_LOADED_ITEMS', snapshot: refreshed });
      expect(state.unloadedCounts.posts).toBe(100);
      expect(merged.unloadedCounts.posts).toBe(0);
    });

    test('keeps a directly opened user once even when they no longer need review', () => {
      const user = createMockUser('direct', 'newContent', { needsReview: false });
      for (const fetchedUsers of [[], [user]]) {
        const queue = getModerationQueueSnapshot(createQueueResult(fetchedUsers, { reviewQueueUsers: { results: [user] } }), user);
        expect(queue.users).toEqual([user]);
        expect(queue.loadedUserIds).toEqual(['direct']);
        expect(queue.unloadedCounts.all).toBe(0);
      }
    });

    test('retains the existing initial curation and queue selection rules', () => {
      const queue = getModerationQueueSnapshot(createQueueResult([createMockUser('queued', 'newContent')]));
      const curationPost: SunshineCurationPostsListItem = {
        _id: 'curation', title: 'Curation candidate', postedAt: '2026-10-14T12:00:00.000Z', baseScore: 10,
        suggestForCuratedUsernames: null, user: null, curationNotices: [],
      };
      const curationState = createInitialInboxState({ queue, curationPosts: [curationPost], initialOpenedUserId: null });
      expect(curationState.activeTab).toBe('curation');
      expect(curationState.focusedPostId).toBe('curation');
      const queueState = createInitialInboxState({
        queue, curationPosts: [{ ...curationPost, curationNotices: [{ _id: 'notice', user: null }] }], initialOpenedUserId: null,
      });
      expect(queueState.activeTab).toBe('newContent');
      expect(queueState.focusedUserId).toBe('queued');
    });
  });

  describe('CLOSE_DETAIL', () => {
    test('preserves focused user and active tab when exiting detail view via ESC', () => {
      const users = [
        createMockUser('user1', 'newContent'),
        createMockUser('user2', 'newContent'),
        createMockUser('user3', 'highContext'),
      ];

      const state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user2',
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      const newState = inboxStateReducer(state, { type: 'CLOSE_DETAIL' });

      expect(newState.activeTab).toBe('newContent');
      expect(newState.focusedUserId).toBe('user2');
      expect(newState.openedUserId).toBe(null);
    });
  });

  describe('NEXT_USER and PREV_USER', () => {
    test('down arrow cycles through end of list back to start', () => {
      const users = [
        createMockUser('user1', 'newContent'),
        createMockUser('user2', 'newContent'),
        createMockUser('user3', 'newContent'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: 'user3',
        openedUserId: null,
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      // Next from last user should wrap to first
      state = inboxStateReducer(state, { type: 'NEXT_USER' });
      expect(state.focusedUserId).toBe('user1');
    });

    test('up arrow cycles through start of list back to end', () => {
      const users = [
        createMockUser('user1', 'newContent'),
        createMockUser('user2', 'newContent'),
        createMockUser('user3', 'newContent'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: 'user1',
        openedUserId: null,
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      // Prev from first user should wrap to last
      state = inboxStateReducer(state, { type: 'PREV_USER' });
      expect(state.focusedUserId).toBe('user3');
    });
  });

  describe('NEXT_TAB and PREV_TAB', () => {
    test('right arrow cycles through end of tabs back to start', () => {
      const users = [
        createMockUser('user1', 'automod'),
        createMockUser('user2', 'newContent'),
        createMockUser('user3', 'highContext'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: 'user2',
        openedUserId: null,
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      // Start at newContent (highest priority)
      expect(state.activeTab).toBe('newContent');

      // Navigate through tabs
      state = inboxStateReducer(state, { type: 'NEXT_TAB' });
      expect(state.activeTab).toBe('highContext');

      state = inboxStateReducer(state, { type: 'NEXT_TAB' });
      expect(state.activeTab).toBe('automod');

      state = inboxStateReducer(state, { type: 'NEXT_TAB' });
      expect(state.activeTab).toBe('all');

      // After 'all', posts tab would come but it's empty (count: 0) so it gets skipped
      // Next from 'all' wraps to first non-empty tab
      state = inboxStateReducer(state, { type: 'NEXT_TAB' });
      expect(state.activeTab).toBe('newContent');
    });

    test('left arrow cycles through start of tabs back to end', () => {
      const users = [
        createMockUser('user1', 'automod'),
        createMockUser('user2', 'newContent'),
        createMockUser('user3', 'highContext'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: 'user2',
        openedUserId: null,
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      // Start at newContent (highest priority)
      expect(state.activeTab).toBe('newContent');

      // Prev from first tab should wrap to last non-empty tab
      // 'posts' is empty (count: 0) so it gets skipped, wrapping to 'all'
      state = inboxStateReducer(state, { type: 'PREV_TAB' });
      expect(state.activeTab).toBe('all');

      // Continue backwards
      state = inboxStateReducer(state, { type: 'PREV_TAB' });
      expect(state.activeTab).toBe('automod');
    });
  });

  describe('REMOVE_USER in inbox view', () => {
    test('removing a user focuses the next user in same group', () => {
      const users = [
        createMockUser('user1', 'newContent'),
        createMockUser('user2', 'newContent'),
        createMockUser('user3', 'newContent'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: 'user2',
        openedUserId: null,
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      state = inboxStateReducer(state, { type: 'REMOVE_USER', userId: 'user2' });

      expect(state.focusedUserId).toBe('user3');
      expect(state.activeTab).toBe('newContent');
      expect(state.openedUserId).toBe(null);
      expect(state.users.length).toBe(2);
    });

    test('removing last user in tab switches to next tab and focuses first user', () => {
      const users = [
        createMockUser('user1', 'newContent'),
        createMockUser('user2', 'highContext'),
        createMockUser('user3', 'automod'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: 'user1',
        openedUserId: null,
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      state = inboxStateReducer(state, { type: 'REMOVE_USER', userId: 'user1' });

      expect(state.activeTab).toBe('highContext');
      expect(state.focusedUserId).toBe('user2');
      expect(state.openedUserId).toBe(null);
      expect(state.users.length).toBe(2);
    });

    test('removing last user overall shows empty "all" tab', () => {
      const users = [
        createMockUser('user1', 'newContent'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: 'user1',
        openedUserId: null,
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      state = inboxStateReducer(state, { type: 'REMOVE_USER', userId: 'user1' });

      expect(state.activeTab).toBe('all');
      expect(state.focusedUserId).toBe(null);
      expect(state.openedUserId).toBe(null);
      expect(state.users.length).toBe(0);
    });
  });

  describe('REMOVE_USER in detail view', () => {
    test('removing a user opens next user in same group (stays in detail view)', () => {
      const users = [
        createMockUser('user1', 'newContent'),
        createMockUser('user2', 'newContent'),
        createMockUser('user3', 'newContent'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user2',
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      state = inboxStateReducer(state, { type: 'REMOVE_USER', userId: 'user2' });

      expect(state.openedUserId).toBe('user3');
      expect(state.activeTab).toBe('newContent');
      expect(state.focusedUserId).toBe(null);
      expect(state.users.length).toBe(2);
    });

    test('removing last user in tab from detail view goes back to inbox view for next tab', () => {
      const users = [
        createMockUser('user1', 'newContent'),
        createMockUser('user2', 'highContext'),
        createMockUser('user3', 'automod'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user1',
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      state = inboxStateReducer(state, { type: 'REMOVE_USER', userId: 'user1' });

      // Should go back to inbox view (not detail view) for next tab
      expect(state.activeTab).toBe('highContext');
      expect(state.focusedUserId).toBe('user2');
      expect(state.openedUserId).toBe(null);
      expect(state.users.length).toBe(2);
    });

    test('removing last user in last tab from detail view closes to empty inbox', () => {
      const users = [
        createMockUser('user1', 'newContent'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user1',
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      state = inboxStateReducer(state, { type: 'REMOVE_USER', userId: 'user1' });

      expect(state.activeTab).toBe('all');
      expect(state.focusedUserId).toBe(null);
      expect(state.openedUserId).toBe(null);
      expect(state.users.length).toBe(0);
    });
  });

  describe('UNDO_ACTION', () => {
    test('reopens the user detail view when the action was done there', () => {
      const undoneUser = createMockUser('user1', 'newContent');
      const users = [
        createMockUser('user2', 'newContent'),
        createMockUser('user3', 'highContext'),
      ];

      const state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'all',
        focusedUserId: null,
        openedUserId: 'user2',
        focusedPostId: null,
        focusedContentIndex: 3,
        sidebarTab: null,
        undoQueue: [createUndoItem(undoneUser, { sourceTab: 'newContent', wasDetailView: true })],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      const newState = inboxStateReducer(state, { type: 'UNDO_ACTION', userId: 'user1' });

      expect(newState.users.map(u => u._id)).toContain('user1');
      expect(newState.undoQueue.length).toBe(0);
      expect(newState.activeTab).toBe('newContent');
      expect(newState.openedUserId).toBe('user1');
      expect(newState.focusedUserId).toBe('user1');
      expect(newState.focusedContentIndex).toBe(0);
    });

    test('refocuses the user in the inbox when the action was done from the inbox', () => {
      const undoneUser = createMockUser('user1', 'newContent');
      const users = [
        createMockUser('user2', 'newContent'),
        createMockUser('user3', 'highContext'),
      ];

      const state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'highContext',
        focusedUserId: null,
        openedUserId: 'user3',
        focusedPostId: null,
        focusedContentIndex: 1,
        sidebarTab: null,
        undoQueue: [createUndoItem(undoneUser, { sourceTab: 'newContent', wasDetailView: false })],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      const newState = inboxStateReducer(state, { type: 'UNDO_ACTION', userId: 'user1' });

      expect(newState.users.map(u => u._id)).toContain('user1');
      expect(newState.undoQueue.length).toBe(0);
      expect(newState.activeTab).toBe('newContent');
      expect(newState.openedUserId).toBe(null);
      expect(newState.focusedUserId).toBe('user1');
    });

    test('does nothing when the user is not in the undo queue', () => {
      const state: InboxState = createState({
        users: [createMockUser('user2', 'newContent')],
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: 'user2',
        openedUserId: null,
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      const newState = inboxStateReducer(state, { type: 'UNDO_ACTION', userId: 'user1' });

      expect(newState).toBe(state);
    });
  });

  describe('Edge cases', () => {
    test('tab navigation is blocked when in detail view', () => {
      const users = [
        createMockUser('user1', 'newContent'),
        createMockUser('user2', 'highContext'),
      ];

      let state: InboxState = createState({
        users,
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user1',
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });

      // Try to change tabs
      const newState = inboxStateReducer(state, { type: 'NEXT_TAB' });

      // State should be unchanged
      expect(newState).toEqual(state);
    });
  });

  describe('sidebarTab', () => {
    function stateWithSidebarTab(sidebarTab: InboxState['sidebarTab']): InboxState {
      return createState({
        users: [createMockUser('user1', 'newContent'), createMockUser('user2', 'newContent')],
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user1',
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        unloadedCounts: {},
      });
    }

    test('no composer is open by default', () => {
      expect(stateWithSidebarTab(null).sidebarTab).toBe(null);
    });

    test('SET_SIDEBAR_TAB opens a composer', () => {
      const state = inboxStateReducer(stateWithSidebarTab(null), { type: 'SET_SIDEBAR_TAB', tab: 'reject' });
      expect(state.sidebarTab).toBe('reject');
    });

    test.each([
      ['NEXT_CONTENT', { type: 'NEXT_CONTENT', contentLength: 3 }],
      ['PREV_CONTENT', { type: 'PREV_CONTENT', contentLength: 3 }],
      ['NEXT_USER', { type: 'NEXT_USER' }],
      ['OPEN_USER', { type: 'OPEN_USER', userId: 'user2' }],
      ['CLOSE_DETAIL', { type: 'CLOSE_DETAIL' }],
    ] as const)('%s closes the open composer', (_label, action) => {
      const state = inboxStateReducer(stateWithSidebarTab('reject'), action);
      expect(state.sidebarTab).toBe(null);
    });

    test('selecting a content item closes the open composer', () => {
      const state = inboxStateReducer(stateWithSidebarTab('dm'), { type: 'OPEN_CONTENT', contentIndex: 2 });
      expect(state.sidebarTab).toBe(null);
      expect(state.focusedContentIndex).toBe(2);
    });

    test("the row's reject button selects that row and opens the reject composer", () => {
      const state = inboxStateReducer(stateWithSidebarTab(null), { type: 'OPEN_CONTENT', contentIndex: 2, sidebarTab: 'reject' });
      expect(state.sidebarTab).toBe('reject');
      expect(state.focusedContentIndex).toBe(2);
    });

    test('actions taken mid-draft leave the composer open', () => {
      const state = inboxStateReducer(stateWithSidebarTab('reject'), {
        type: 'SET_LLM_CHECK_RUNNING',
        documentId: 'post1',
      });
      expect(state.sidebarTab).toBe('reject');
    });
  });
});
