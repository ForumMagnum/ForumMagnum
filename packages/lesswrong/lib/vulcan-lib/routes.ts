import { matchPath } from '@/lib/vendor/react-router/matchPath';
import type { Request, Response } from 'express';
import { captureException } from '@/lib/sentryWrapper';
import { isClient } from '../executionEnvironment';
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

export type Route = {
  /**
   * Name of the route. Must be unique. In theory, should have no effect; in
   * practice, some components are comparing route names to expected values,
   * which we should refactor to make them not do anymore.
   */
  name: string,
  
  /**
   * URL pattern for this route. Syntax comes from the path-to-regexp library
   * (via indirect dependency via react-router).
   */
  path: string,
  
  component?: React.ComponentType<any>,

  title?: string,
  titleComponent?: React.FunctionComponent<{ siteName: string, isSubtitle: boolean }>,
  subtitle?: string,
  headerSubtitle?: string,
  subtitleLink?: string,
  subtitleComponent?: React.FunctionComponent<{ isSubtitle?: boolean }>,
  description?: string,
  redirect?: (location: RouterLocation) => string | null,
  getPingback?: (parsedUrl: RouterLocation, context: ResolverContext) => Promise<PingbackDocument|null> | PingbackDocument|null,
  previewComponent?: React.FunctionComponent<{ href: string, targetLocation?: RouterLocation, id?: string, noPrefetch?: boolean, children: React.ReactNode, className?: string }>,
  _id?: string|null,
  noIndex?: boolean,
  background?: string,
  sunshineSidebar?: boolean
  disableAutoRefresh?: boolean,
  initialScroll?: "top"|"bottom",
  noFooter?: boolean,
  standalone?: boolean // if true, this page has no header / intercom
  staticHeader?: boolean // if true, the page header is not sticky to the top of the screen
  fullscreen?: boolean // if true, the page contents are put into a flexbox with the header such that the page contents take up the full height of the screen without scrolling
  unspacedGrid?: boolean // for routes with standalone navigation, setting this to true allows the page body to be full-width (the default is to have empty columns providing padding)

  hasLeftNavigationColumn?: boolean
  navigationFooterBar?: boolean,
  
  /**
   * enableResourcePrefetch: Start loading stylesheet and JS bundle before the page is
   * rendered. This requires sending headers before rendering, which means
   * that the page can't return an HTTP error status or an HTTP redirect. In
   * exchange, loading time is significantly improved for users who don't have
   * the stylesheet and JS bundle already in their cache.
   *
   * This should only return true for routes which are *guaranteed* to return a 200 status code.
   * I.e. it is better to give false negatives (not prefetching on a route that actually returns
   * a 200) than false positives.
   */
  enableResourcePrefetch?: boolean | ((req: Request, res: Response, parsedRoute: RouterLocation, context: ResolverContext) => Promise<boolean>),
  
  expectedHeadBlocks?: string[]

  /**
   * Under what circumstances stale-while-revalidate caching should be enabled on this route.
   * If enabled, page loads where this is allowed will have a "Cache-control: max-age=1, s-max-age=1, stale-while-revalidate=86400"
   * header applied, which allows CDNs to cache them for up to 1 day
   */
  swrCaching?: "logged-out"
  isAdmin?: boolean
};

/** Populated by calls to addRoute */
export const Routes: Record<string,Route> = {};

// Add a route to the routes table.
//
// Because routes have a bunch of optional fields and fields with constrained
// strings (for component names), merging the types of a bunch of route
// definitions in an array would produce an incorrect type. So instead of taking
// an array argument, take varargs, which preserve the original type.
export const addRoute = (...routes: Route[]): void => {
  for (let route of routes) {
    const {name, path, ...properties} = route;
  
    // check if there is already a route registered to this path
    const routeWithSamePath = Object.values(Routes).find(route => route.path === path);
  
    if (routeWithSamePath) {
      // Don't allow shadowing/replacing routes
      throw new Error(`Conflicting routes with path ${path}`);
    }
    
    // Check for name collisions
    if (Routes[name]) {
      throw new Error(`Conflicting routes with name ${name}`);
    }
  
    // register the new route
    Routes[name] = {
      name,
      path,
      ...properties
    };
  }
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

  const params = routePattern !== undefined ? matchPath<Record<string, string>>(location.pathname, { path: routePattern, exact: true, strict: false })!.params : {};
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

function getPatternMatchingPathname<Patterns extends string[]>(pathname: string, routePatterns: Patterns): Patterns[number] | undefined {
  return routePatterns.find((routePattern) => matchPath(pathname, {
    path: routePattern,
    exact: true,
    strict: false,
  }));
}
