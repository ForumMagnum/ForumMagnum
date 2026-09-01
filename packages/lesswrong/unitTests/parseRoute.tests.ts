import { parsePath } from '@/lib/routeChecks/parsePath';
import { parseRoute } from '@/lib/routeChecks/parseRoute';

describe('parseRoute', () => {
  it('preserves query parameters from the original URL when applying redirects', () => {
    const result = parseRoute({
      location: parsePath('/inbox/fakeconversationid?utm_source=twitter'),
      routePatterns: ['/inbox/[conversationId]', '/inbox'],
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

  it('does not match a dynamic route pattern for a pathname that a static route shadows', () => {
    for (const pathname of ['/w/create', '/w/dashboard', '/w/random']) {
      const result = parseRoute({
        location: parsePath(pathname),
        onError: () => {},
        routePatterns: ['/w/[slug]', '/w/[slug]/discussion'],
      });
      expect(result.routePattern).toBeUndefined();
      expect(result.params).toEqual({});
    }
  });

  it('matches a dynamic route pattern for a pathname with no static shadow', () => {
    const result = parseRoute({
      location: parsePath('/w/logical-decision-theories'),
      routePatterns: ['/w/[slug]', '/w/[slug]/discussion'],
    });
    expect(result.routePattern).toBe('/w/[slug]');
    expect(result.params).toEqual({ slug: 'logical-decision-theories' });
  });

  it('respects static-over-dynamic precedence for colon-format patterns with optional segments', () => {
    const result = parseRoute({
      location: parsePath('/posts/slug/some-post-slug'),
      routePatterns: ['/posts/:_id/:slug?', '/posts/slug/:slug?'],
    });
    expect(result.routePattern).toBe('/posts/slug/:slug?');
    expect(result.params).toEqual({ slug: 'some-post-slug' });
  });
});
