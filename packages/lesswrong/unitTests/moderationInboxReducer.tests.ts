import { inboxStateReducer, type InboxAction, type InboxState, type UndoHistoryItem } from '@/components/sunshineDashboard/supermod/inboxReducer';
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

function createMockPost(id: string, partialPost?: Partial<SunshinePostsList>): SunshinePostsList {
  return {
    __typename: 'Post' as const,
    _id: id,
    title: `Post ${id}`,
    postedAt: new Date().toISOString(),
    reviewedByUserId: null,
    ...partialPost,
  } as SunshinePostsList;
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

describe('Moderation Inbox Reducer', () => {
  describe('CLOSE_DETAIL', () => {
    test('preserves focused user and active tab when exiting detail view via ESC', () => {
      const users = [
        createMockUser('user1', 'newContent'),
        createMockUser('user2', 'newContent'),
        createMockUser('user3', 'highContext'),
      ];

      const state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

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

      const state: InboxState = {
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
        removedPostIds: [],
      };

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

      const state: InboxState = {
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
        removedPostIds: [],
      };

      const newState = inboxStateReducer(state, { type: 'UNDO_ACTION', userId: 'user1' });

      expect(newState.users.map(u => u._id)).toContain('user1');
      expect(newState.undoQueue.length).toBe(0);
      expect(newState.activeTab).toBe('newContent');
      expect(newState.openedUserId).toBe(null);
      expect(newState.focusedUserId).toBe('user1');
    });

    test('does nothing when the user is not in the undo queue', () => {
      const state: InboxState = {
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
        removedPostIds: [],
      };

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

      let state: InboxState = {
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
        removedPostIds: [],
      };

      // Try to change tabs
      const newState = inboxStateReducer(state, { type: 'NEXT_TAB' });

      // State should be unchanged
      expect(newState).toEqual(state);
    });
  });

  describe('sidebarTab', () => {
    function stateWithSidebarTab(sidebarTab: InboxState['sidebarTab']): InboxState {
      return {
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
        removedPostIds: [],
      };
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

  describe('REMOVE_POST', () => {
    test('records the removed post id so a background refresh cannot re-add it', () => {
      const state: InboxState = {
        users: [],
        posts: [createMockPost('postA'), createMockPost('postB')],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'posts',
        focusedUserId: null,
        openedUserId: null,
        focusedPostId: 'postA',
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        removedPostIds: [],
      };

      const newState = inboxStateReducer(state, { type: 'REMOVE_POST', postId: 'postA' });

      expect(newState.posts.map(p => p._id)).toEqual(['postB']);
      expect(newState.removedPostIds).toEqual(['postA']);
    });
  });

  describe('SET_FOCUSED_CONTENT_INDEX', () => {
    test('moves the content focus without closing the open composer', () => {
      const state: InboxState = {
        users: [createMockUser('user1', 'newContent')],
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user1',
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: 'reject',
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        removedPostIds: [],
      };

      const newState = inboxStateReducer(state, { type: 'SET_FOCUSED_CONTENT_INDEX', index: 2 });

      expect(newState.focusedContentIndex).toBe(2);
      expect(newState.sidebarTab).toBe('reject');
    });
  });

  describe('REFRESH_DATA', () => {
    function refreshAction(overrides?: Partial<Extract<InboxAction, { type: 'REFRESH_DATA' }>>) {
      return {
        type: 'REFRESH_DATA' as const,
        users: [],
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        directUserId: null,
        ...overrides,
      };
    }

    test('appends newly arrived users and posts, and drops ones handled elsewhere', () => {
      const state: InboxState = {
        users: [createMockUser('user1', 'newContent'), createMockUser('user2', 'newContent')],
        posts: [createMockPost('postA')],
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
        removedPostIds: [],
      };

      // user2 and postA vanished server-side; user3 and postB are new
      const newState = inboxStateReducer(state, refreshAction({
        users: [createMockUser('user1', 'newContent'), createMockUser('user3', 'highContext')],
        posts: [createMockPost('postB')],
      }));

      expect(newState.users.map(u => u._id)).toEqual(['user1', 'user3']);
      expect(newState.posts.map(p => p._id)).toEqual(['postB']);
    });

    test('updates fields of existing users, but keeps the local version of the focused user', () => {
      const state: InboxState = {
        users: [
          createMockUser('user1', 'newContent', { karma: 1 }),
          createMockUser('user2', 'newContent', { karma: 2 }),
        ],
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
        removedPostIds: [],
      };

      const newState = inboxStateReducer(state, refreshAction({
        users: [
          createMockUser('user1', 'newContent', { karma: 100 }),
          createMockUser('user2', 'newContent', { karma: 200 }),
        ],
      }));

      // user1 is focused (possibly mid-action), so it keeps the local copy
      expect(newState.users.find(u => u._id === 'user1')?.karma).toBe(1);
      expect(newState.users.find(u => u._id === 'user2')?.karma).toBe(200);
    });

    test('never removes the opened, focused, or deep-linked user', () => {
      const state: InboxState = {
        users: [
          createMockUser('user1', 'newContent'),
          createMockUser('user2', 'newContent'),
          createMockUser('user3', 'newContent'),
        ],
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: 'user1',
        openedUserId: 'user2',
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        removedPostIds: [],
      };

      const newState = inboxStateReducer(state, refreshAction({
        users: [],
        directUserId: 'user3',
      }));

      expect(newState.users.map(u => u._id)).toEqual(['user1', 'user2', 'user3']);
    });

    test('does not re-add users that are in the undo queue or history', () => {
      const undoUser = createMockUser('user2', 'newContent');
      const historyUser = createMockUser('user3', 'newContent');
      const state: InboxState = {
        users: [createMockUser('user1', 'newContent')],
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: 'user1',
        openedUserId: null,
        focusedPostId: null,
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [createUndoItem(undoUser)],
        history: [{ user: historyUser, actionLabel: 'Approved', timestamp: 0 }],
        runningLlmCheckId: null,
        removedPostIds: [],
      };

      // The server hasn't processed those reviews yet, so it still returns both users
      const newState = inboxStateReducer(state, refreshAction({
        users: [createMockUser('user1', 'newContent'), undoUser, historyUser],
      }));

      expect(newState.users.map(u => u._id)).toEqual(['user1']);
    });

    test('does not re-add locally removed posts, and keeps the focused post', () => {
      const state: InboxState = {
        users: [],
        posts: [createMockPost('postA')],
        classifiedPosts: [createMockPost('postC')],
        curationPosts: [],
        activeTab: 'posts',
        focusedUserId: null,
        openedUserId: null,
        focusedPostId: 'postA',
        focusedContentIndex: 0,
        sidebarTab: null,
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        removedPostIds: ['postB'],
      };

      // postB was reviewed locally but still returned; postA is focused and absent
      const newState = inboxStateReducer(state, refreshAction({
        posts: [createMockPost('postB')],
        classifiedPosts: [createMockPost('postC'), createMockPost('postB')],
      }));

      expect(newState.posts.map(p => p._id)).toEqual(['postA']);
      expect(newState.classifiedPosts.map(p => p._id)).toEqual(['postC']);
    });

    test('leaves focus, tab, and composer state untouched', () => {
      const state: InboxState = {
        users: [createMockUser('user1', 'newContent')],
        posts: [],
        classifiedPosts: [],
        curationPosts: [],
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user1',
        focusedPostId: null,
        focusedContentIndex: 3,
        sidebarTab: 'dm',
        undoQueue: [],
        history: [],
        runningLlmCheckId: null,
        removedPostIds: [],
      };

      const newState = inboxStateReducer(state, refreshAction({
        users: [createMockUser('user1', 'newContent'), createMockUser('user2', 'automod')],
      }));

      expect(newState.activeTab).toBe('newContent');
      expect(newState.openedUserId).toBe('user1');
      expect(newState.focusedContentIndex).toBe(3);
      expect(newState.sidebarTab).toBe('dm');
    });
  });
});
