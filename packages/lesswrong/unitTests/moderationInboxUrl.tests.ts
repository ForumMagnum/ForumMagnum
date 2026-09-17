import { getModerationInboxSearch, parseModerationQueue } from '@/components/sunshineDashboard/supermod/inboxUrl';

describe('moderation inbox URL', () => {
  it('retains the spam queue when reopening a user URL', () => {
    const search = getModerationInboxSearch('', 'maybeSpam', 'user123');
    const params = new URLSearchParams(search);
    expect(params.get('user')).toBe('user123');
    expect(parseModerationQueue(params.get('queue'))).toBe('maybeSpam');
  });

  it('keeps the queue and unrelated parameters when closing a user', () => {
    const search = getModerationInboxSearch('?user=user123&queue=maybeSpam&extra=value', 'maybeSpam', null);
    const params = new URLSearchParams(search);
    expect(params.has('user')).toBe(false);
    expect(params.get('queue')).toBe('maybeSpam');
    expect(params.get('extra')).toBe('value');
  });

  it('updates the queue when switching tabs', () => {
    expect(new URLSearchParams(getModerationInboxSearch('?queue=maybeSpam', 'automod', null)).get('queue')).toBe('automod');
  });

  it.each([undefined, null, '', 'invalid', ['maybeSpam'], 'toString'])('ignores invalid queue values: %s', value => {
    expect(parseModerationQueue(value)).toBeUndefined();
  });

  it.each(['all', 'posts', 'classifiedPosts', 'curation', 'newContent', 'offboard', 'highContext', 'maybeSpam', 'automod', 'snoozeExpired', 'unknown'])('restores %s', queue => {
    expect(parseModerationQueue(queue)).toBe(queue);
  });
});
