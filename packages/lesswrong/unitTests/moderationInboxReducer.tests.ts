import {
  type InboxState,
  inboxStateReducer,
} from '../components/sunshineDashboard/supermod/ModerationInbox';
import type { ReviewGroup } from '../components/sunshineDashboard/supermod/groupings';
import {
  UNREVIEWED_FIRST_POST,
  MANUAL_FLAG_ALERT,
  UNREVIEWED_BIO_UPDATE,
  STRICTER_COMMENT_AUTOMOD_RATE_LIMIT,
  MANUAL_NEEDS_REVIEW,
} from '../lib/collections/moderatorActions/constants';

const moderatorActionTypes: Record<ReviewGroup, ModeratorActionType> = {
  newContent: UNREVIEWED_FIRST_POST,
  highContext: MANUAL_FLAG_ALERT,
  maybeSpam: UNREVIEWED_BIO_UPDATE,
  automod: STRICTER_COMMENT_AUTOMOD_RATE_LIMIT,
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
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user2',
        focusedContentIndex: 0,
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
        activeTab: 'newContent',
        focusedUserId: 'user3',
        openedUserId: null,
        focusedContentIndex: 0,
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
        activeTab: 'newContent',
        focusedUserId: 'user1',
        openedUserId: null,
        focusedContentIndex: 0,
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
        activeTab: 'newContent',
        focusedUserId: 'user2',
        openedUserId: null,
        focusedContentIndex: 0,
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

      // Next from 'all' should wrap to first tab
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
        activeTab: 'newContent',
        focusedUserId: 'user2',
        openedUserId: null,
        focusedContentIndex: 0,
      };

      // Start at newContent (highest priority)
      expect(state.activeTab).toBe('newContent');

      // Prev from first tab should wrap to 'all'
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
        activeTab: 'newContent',
        focusedUserId: 'user2',
        openedUserId: null,
        focusedContentIndex: 0,
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
        activeTab: 'newContent',
        focusedUserId: 'user1',
        openedUserId: null,
        focusedContentIndex: 0,
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
        activeTab: 'newContent',
        focusedUserId: 'user1',
        openedUserId: null,
        focusedContentIndex: 0,
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
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user2',
        focusedContentIndex: 0,
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
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user1',
        focusedContentIndex: 0,
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
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user1',
        focusedContentIndex: 0,
      };

      state = inboxStateReducer(state, { type: 'REMOVE_USER', userId: 'user1' });

      expect(state.activeTab).toBe('all');
      expect(state.focusedUserId).toBe(null);
      expect(state.openedUserId).toBe(null);
      expect(state.users.length).toBe(0);
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
        activeTab: 'newContent',
        focusedUserId: null,
        openedUserId: 'user1',
        focusedContentIndex: 0,
      };

      // Try to change tabs
      const newState = inboxStateReducer(state, { type: 'NEXT_TAB' });

      // State should be unchanged
      expect(newState).toEqual(state);
    });
  });
});

