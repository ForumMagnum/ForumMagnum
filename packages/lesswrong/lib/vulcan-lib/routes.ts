import { applyParamsToPathname, compilePath, matchPath } from '@/lib/vendor/react-router/matchPath';
import type { Request, Response } from 'express';
import { captureException } from '@/lib/sentryWrapper';
import { isClient } from '../executionEnvironment';
import { redirects } from "@/lib/redirects";
import qs from 'qs';

export type PingbackDocument = {
  collectionName: CollectionNameString,
  documentId: string,
};

export interface SegmentedUrl {
  pathname: string
  search: string
  hash: string
}

export type RouterLocation = {
  location: SegmentedUrl,
  pathname: string,
  url: string,
  hash: string,
  params: Record<string,string>,
  query: Record<string,string>, // TODO: this should be Record<string,string|string[]>
  redirected?: boolean,
};

/**
 * Given a Location, return the parsed query from the URL.
 */
export function parseQuery(location: SegmentedUrl): Record<string, string> {
  let query = location?.search;
  if (!query) return {};

  // The unparsed query string looks like ?foo=bar&numericOption=5&flag but the
  // 'qs' parser wants it without the leading question mark, so strip the
  // question mark.
  if (query.startsWith('?'))
    query = query.substr(1);

  return qs.parse(query) as Record<string, string>;
}

// From react-router-v4
// https://github.com/ReactTraining/history/blob/master/modules/PathUtils.js
export const parsePath = function parsePath(path: string): SegmentedUrl {
  var pathname = path || '/';
  var search = '';
  var hash = '';

  var hashIndex = pathname.indexOf('#');
  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex);
    pathname = pathname.substr(0, hashIndex);
  }

  var searchIndex = pathname.indexOf('?');
  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex);
    pathname = pathname.substr(0, searchIndex);
  }

  return {
    pathname: pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
  };
};

export function parseRoute<Patterns extends string[]>({ location, onError = null, routePatterns }: {
  location: SegmentedUrl;
  onError?: null | ((err: string) => void);
  routePatterns: Patterns;
}) {
  const pathWithRedirects = applyRedirectsTo(location.pathname);
  // We need to parse the path after applying the redirects
  // because `getPatternMatchingPathname` doesn't handle query params/etc,
  // so we extract the pathname to match against and use the rest for
  // constructing the RouterLocation later.
  const parsedPath = parsePath(pathWithRedirects);

  // However, for reconstructing the "location" (and other details),
  // we need to use the search params from both the original location
  // and the post-redirect location, since the redirect-following logic
  // doesn't preserve query params (though it might add new ones if there's a mapping)
  const newUrlSearchParams = new URLSearchParams(parsedPath.search);
  const urlSearchParams = new URLSearchParams(location.search);
  newUrlSearchParams.forEach((value, key) => {
    urlSearchParams.set(key, value);
  });

  const search = urlSearchParams.toString() ? `?${urlSearchParams.toString()}` : '';
  const hash = parsedPath.hash || location.hash;
  const { pathname } = parsedPath;

  const routePattern = getPatternMatchingPathname(pathname, routePatterns);

  if (routePattern === undefined) {
    if (onError) {
      onError(location.pathname);
    } else {
      // If the route is unparseable, that's a 404. Only log this in Sentry if
      // we're on the client, not if this is SSR. This is a compromise between
      // catching broken links, and spam in Sentry; crawlers and bots that try lots
      // of invalid URLs generally won't execute Javascript (especially after
      // getting a 404 status), so this should only log when someone reaches a
      // 404 with an actual browser.
      // Unfortunately that also means it doesn't look broken resource links (ie
      // images), but we can't really distinguish between "post contained a broken
      // image link and it mattered" and "bot tried a weird URL and it didn't
      // resolve to anything".
      if (isClient) {
        captureException(new Error(`404 not found: ${location.pathname}`));
      }
    }
  }


  const params = routePattern !== undefined
    ? matchPath<Record<string, string>>(pathname, { path: routePattern, exact: true, strict: false })!.params
    : {};

  const query = parseQuery({ ...parsedPath, search, hash });

  const result = {
    routePattern,
    location: { ...parsedPath, search, hash },
    params,
    pathname,
    url: pathname + search + hash,
    hash,
    query,
  };

  return result;
}

function applyRedirectsTo(pathname: string): string {
  for (const redirect of redirects) {
    const { source, destination } = redirect;
    const pathOptions = { path: source, exact: true, strict: false, sensitive: false } as const;
    const match = matchPath(pathname, pathOptions);
    if (match) {
      return applyParamsToPathname(destination, match.params);
    }
  }
  
  return pathname;
}

function getPatternMatchingPathname<Patterns extends string[]>(pathname: string, routePatterns: Patterns): Patterns[number] | undefined {
  return routePatterns.find((routePattern) => matchPath(pathname, {
    path: routePattern,
    exact: true,
    strict: false,
  }));
}
