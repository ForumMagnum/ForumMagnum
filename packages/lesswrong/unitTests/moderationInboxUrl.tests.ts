import { getInboxSearchUpdate, getInitialOpenedUserId } from '@/components/sunshineDashboard/supermod/inboxUrl';

describe('Moderation inbox URL state', () => {
  describe('getInitialOpenedUserId', () => {
    test('uses the browser URL when the location context is empty during hydration', () => {
      expect(getInitialOpenedUserId(null, '?user=user1')).toBe('user1');
    });

    test('uses the location context during SSR', () => {
      expect(getInitialOpenedUserId('user1')).toBe('user1');
    });

    test('does not reuse a stale location-context user on the client', () => {
      expect(getInitialOpenedUserId('user1', '?foo=bar')).toBeNull();
    });
  });

  describe('getInboxSearchUpdate', () => {
    test('does not clear an incoming deep link before a user has been opened', () => {
      expect(getInboxSearchUpdate({
        currentSearch: '?user=user1&foo=bar',
        previousOpenedUserId: null,
        openedUserId: null,
      })).toBeNull();
    });

    test('sets an opened user while preserving unrelated parameters', () => {
      expect(getInboxSearchUpdate({
        currentSearch: '?foo=bar',
        previousOpenedUserId: null,
        openedUserId: 'user1',
      })).toBe('foo=bar&user=user1');
    });

    test('clears a user after the matching detail view closes', () => {
      expect(getInboxSearchUpdate({
        currentSearch: '?user=user1&foo=bar',
        previousOpenedUserId: 'user1',
        openedUserId: null,
      })).toBe('foo=bar');
    });

    test('does not clear a different user introduced outside the reducer', () => {
      expect(getInboxSearchUpdate({
        currentSearch: '?user=user2&foo=bar',
        previousOpenedUserId: 'user1',
        openedUserId: null,
      })).toBeNull();
    });
  });
});
