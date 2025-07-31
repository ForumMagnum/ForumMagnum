'use client';

import React from 'react';
// eslint-disable-next-line no-restricted-imports
import { matchPath } from 'react-router';

import qs from 'qs'
import { captureException } from '@sentry/nextjs';
import { isClient } from '../executionEnvironment';
import type { RouterLocation, SegmentedUrl } from '../vulcan-lib/routes';
import { getRouteMatchingPathname } from "../vulcan-lib/routes";
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface ServerRequestStatusContextType {
  status?: number
  redirectUrl?: string
};

export const LocationContext = React.createContext<RouterLocation|null>(null);
export const SubscribeLocationContext = React.createContext<RouterLocation|null>(null);
export const NavigationContext = React.createContext<{ history: AppRouterInstance }|null>(null);
export const ServerRequestStatusContext = React.createContext<ServerRequestStatusContextType|null>(null);

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

  return qs.parse(query) as Record<string,string>;
}

// Match a string against the routes table, and parse the route components.
// If there is no match, returns a special 404 route, and calls onError if
// provided.
export function parseRoute({location, followRedirects=true, onError=null}: {
  location: SegmentedUrl,
  followRedirects?: boolean,
  onError?: null|((err: string) => void),
}): RouterLocation {
  const currentRoute = getRouteMatchingPathname(location.pathname)
  
  if (!currentRoute) {
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
  
  const params = currentRoute ? matchPath(location.pathname, { path: currentRoute.path, exact: true, strict: false })!.params : {}
  const RouteComponent = currentRoute?.component // ?? Error404; // currentRoute?.componentName ? Components[currentRoute.componentName] : Error404;
  const result: RouterLocation = {
    currentRoute: currentRoute!, //TODO: Better null handling than this
    RouteComponent, location, params,
    pathname: location.pathname,
    url: location.pathname + location.search + location.hash,
    hash: location.hash,
    query: parseQuery(location),
  };
  
  if (currentRoute && currentRoute.redirect) {
    const redirectTo = currentRoute.redirect(result);
    if (redirectTo) {
      return {
        ...parseRoute({
          location: parsePath(redirectTo),
          onError
        }),
        redirected: true,
      };
    }
  }
  
  return result;
}

function getPatternMatchingPathname<Patterns extends string[]>(pathname: string, routePatterns: Patterns): Patterns[number] | undefined {
  return routePatterns.find((routePattern) => matchPath(pathname, {
    path: routePattern,
    exact: true,
    strict: false,
  }));
}

export function parseRoute2<Patterns extends string[]>({location, onError=null, routePatterns}: {
  location: SegmentedUrl,
  onError?: null|((err: string) => void),
  routePatterns: Patterns,
}) {
  const routePattern = getPatternMatchingPathname(location.pathname, routePatterns);
  
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
  
  const params = routePattern !== undefined ? matchPath(location.pathname, { path: routePattern, exact: true, strict: false })!.params : {}
  const result = {
    routePattern,
    location,
    params,
    pathname: location.pathname,
    url: location.pathname + location.search + location.hash,
    hash: location.hash,
    query: parseQuery(location),
  };
  
  return result;
}

