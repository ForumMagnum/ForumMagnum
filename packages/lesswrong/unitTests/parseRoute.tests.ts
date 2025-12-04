import { parsePath, parseRoute } from '@/lib/vulcan-lib/routes';

describe('parseRoute', () => {
  it('preserves query parameters from the original URL when applying redirects', () => {
    const result = parseRoute({
      location: parsePath('/inbox/fakeconversationid?utm_source=twitter'),
      routePatterns: ['/inbox/:conversationId', '/inbox'],
    });

    const expectedSearch = '?utm_source=twitter&conversation=fakeconversationid';

    expect(result.query).toEqual({ conversation: 'fakeconversationid', utm_source: 'twitter' });
    expect(result.url).toBe('/inbox' + expectedSearch);
    expect(result.pathname).toBe('/inbox');
    expect(result.hash).toBe('');
    expect(result.routePattern).toBe('/inbox');
    expect(result.params).toEqual({});
    expect(result.location).toEqual({ pathname: '/inbox', search: expectedSearch, hash: '' });
  });
});
