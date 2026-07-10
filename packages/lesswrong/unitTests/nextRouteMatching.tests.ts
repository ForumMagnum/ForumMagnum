import { canonicalizePath, findNextConsistentRoutePatternMatch, getNextRoutePatternForPathname } from '@/lib/routeChecks/nextRouteMatching';
import { expandRoutePatternToNextRoutePatterns } from '@/lib/routeChecks/routePatternFormat';
import { getMarkdownPathname } from '@/lib/routeChecks/markdownVersionRoutes';
import type { RouteNode } from '@/lib/generated/routeManifest';

describe('canonicalizePath', () => {
  it('canonicalizes the capitalization of static segments', () => {
    expect(canonicalizePath('/W/Create')).toBe('/w/create');
    expect(canonicalizePath('/BestOfLessWrong')).toBe('/bestoflesswrong');
    expect(canonicalizePath('/w/create')).toBe('/w/create');
  });

  it('preserves parameter values in dynamic segments', () => {
    expect(canonicalizePath('/w/Logical-Decision-Theories')).toBe('/w/Logical-Decision-Theories');
    expect(canonicalizePath('/Posts/abc123/Some-Post')).toBe('/posts/abc123/Some-Post');
  });

  it('ignores query strings and hashes', () => {
    expect(canonicalizePath('/W/Create?foo=bar#baz')).toBe('/w/create');
  });

  it('resolves the root route', () => {
    expect(canonicalizePath('/')).toBe('/');
  });

  it('returns null for pathnames that resolve to no route', () => {
    expect(canonicalizePath('/no/such/route')).toBeNull();
  });
});

describe('getNextRoutePatternForPathname', () => {
  it('prefers static routes over dynamic ones', () => {
    expect(getNextRoutePatternForPathname('/w/create')).toBe('/w/create');
    expect(getNextRoutePatternForPathname('/w/dashboard')).toBe('/w/dashboard');
    expect(getNextRoutePatternForPathname('/w/random')).toBe('/w/random');
    expect(getNextRoutePatternForPathname('/posts/slug/foo')).toBe('/posts/slug/[slug]');
  });

  it('resolves dynamic routes', () => {
    expect(getNextRoutePatternForPathname('/w/logical-decision-theories')).toBe('/w/[slug]');
    expect(getNextRoutePatternForPathname('/w/some-tag/discussion')).toBe('/w/[slug]/discussion');
    expect(getNextRoutePatternForPathname('/posts/abc123/some-post')).toBe('/posts/[_id]/[slug]');
  });

  it('matches static segments case-sensitively, like the Next router', () => {
    expect(getNextRoutePatternForPathname('/W/Create')).toBeNull();
    expect(getNextRoutePatternForPathname('/w/Create')).toBe('/w/[slug]');
  });

  it('ignores query strings, hashes, and trailing slashes', () => {
    expect(getNextRoutePatternForPathname('/w/create?foo=bar#baz')).toBe('/w/create');
    expect(getNextRoutePatternForPathname('/w/create/')).toBe('/w/create');
  });

  it('resolves the root route', () => {
    expect(getNextRoutePatternForPathname('/')).toBe('/');
  });

  it('returns null for pathnames that resolve to no route', () => {
    expect(getNextRoutePatternForPathname('/w/some-tag/no-such-subpage')).toBeNull();
    expect(getNextRoutePatternForPathname('/no/such/route')).toBeNull();
  });

  it('matches an optional catch-all against zero or more remaining segments', () => {
    const fixtureTrie: RouteNode = {
      staticChildren: {
        docs: {
          optionalCatchAll: {
            paramName: 'path',
            child: { hasPage: true },
          },
        },
      },
      lowerCase: { docs: 'docs' },
    };
    expect(getNextRoutePatternForPathname('/docs', fixtureTrie)).toBe('/docs/[[...path]]');
    expect(getNextRoutePatternForPathname('/docs/a', fixtureTrie)).toBe('/docs/[[...path]]');
    expect(getNextRoutePatternForPathname('/docs/a/b', fixtureTrie)).toBe('/docs/[[...path]]');
    expect(getNextRoutePatternForPathname('/other', fixtureTrie)).toBeNull();
  });
});

describe('expandRoutePatternToNextRoutePatterns', () => {
  it('returns Next-format patterns unchanged', () => {
    expect(expandRoutePatternToNextRoutePatterns('/w/[slug]')).toEqual(['/w/[slug]']);
    expect(expandRoutePatternToNextRoutePatterns('/about')).toEqual(['/about']);
  });

  it('expands colon-format patterns with optional segments', () => {
    expect(expandRoutePatternToNextRoutePatterns('/posts/:_id/:slug?')).toEqual(['/posts/[_id]', '/posts/[_id]/[slug]']);
  });
});

describe('findNextConsistentRoutePatternMatch', () => {
  it('rejects a matchPath hit that the Next router would route elsewhere', () => {
    expect(findNextConsistentRoutePatternMatch('/w/create', ['/w/[slug]'])).toBeNull();
  });

  it('returns the matching pattern and its params', () => {
    expect(findNextConsistentRoutePatternMatch('/w/some-tag', ['/w/[slug]'])).toEqual({
      routePattern: '/w/[slug]',
      params: { slug: 'some-tag' },
    });
  });
});

describe('getMarkdownPathname', () => {
  it('does not treat static wiki subpages as tag pages', () => {
    expect(getMarkdownPathname('/w/create')).toBeNull();
    expect(getMarkdownPathname('/w/some-tag')).toBe('/api/tag/some-tag');
  });

  it('rewrites by-slug post links via the by-slug route, not the by-id route', () => {
    expect(getMarkdownPathname('/posts/slug/foo')).toBe('/api/post/foo');
    expect(getMarkdownPathname('/posts/abc123/some-post')).toBe('/api/post/abc123');
  });
});
