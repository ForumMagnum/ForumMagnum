import { matchPath } from '../vendor/react-router/matchPath';
import { isAF } from "../instanceSettings";
import { routePatternToReactRouterPath } from './routePatternFormat';
import type { ParamMap } from '../../../../.next/types/routes';

type NextExistingRoute = keyof ParamMap;

function pathnameMatchesAnyOf(pathname: string, routePaths: NextExistingRoute[]) {
  return routePaths.some(routePath => pathnameMatchesRoutePath(pathname, routePath));
}

function pathnameMatchesRoutePath(pathname: string, routePath: NextExistingRoute) {
  return !!matchPath(pathname, {
    path: routePatternToReactRouterPath(routePath),
    exact: true,
    strict: false,
  });
}

export const isHomeRoute = (pathname: string) => pathnameMatchesRoutePath(pathname, '/') && !isAF();

export const isSunshineSidebarRoute = (pathname: string) => pathnameMatchesRoutePath(pathname, '/');

export const isStandaloneRoute = (pathname: string) => pathnameMatchesAnyOf(pathname, [
  '/crosspostLogin',
  '/groups-map'
]);

// ea-forum-look-here Uncomment when this route exists
//export const isStaticHeaderRoute = (pathname: string) => pathnameMatchesRoutePath(pathname, '/admin/digests/[num]');
export const isStaticHeaderRoute = (pathname: string) => false;

export const isFullscreenRoute = (pathname: string) => pathnameMatchesAnyOf(pathname, [
  "/inbox",
  "/inbox/[conversationId]",
  "/moderatorInbox",
]);

const routesWithLeftNavigationColumn = [
  "/",
  "/allPosts",
  "/questions",
  "/quicktakes",
  "/collections/[_id]",
  "/library",
] as const satisfies readonly NextExistingRoute[];

export type LeftNavigationRoutePattern = typeof routesWithLeftNavigationColumn[number];

export const isRouteWithLeftNavigationColumn = (pathname: string) => pathnameMatchesAnyOf(pathname, [...routesWithLeftNavigationColumn]);

// ea-forum-look-here There was some special casing in Layout specific to the
// subforum2 route. We dropped that route entirely along with its special
// casing, but the corresponding styles are likely significantly easier to
// reimplement with things as they're currently organized than they were before.
/*export const isUnspacedGridRoute = (pathname: string) => {
  // Check for the subforum2 route pattern
  const routePath = `/${taggingNamePluralSetting.get()}/:slug/subforum2`;
  return pathnameMatchesRoutePath(pathname, routePath);
};*/

export const isPostsSingleRoute = (pathname: string) => {
  const match = matchPath<{ _id: string }>(pathname, {
    path: ['/posts/[_id]', '/posts/[_id]/[slug]'].map(routePatternToReactRouterPath),
    exact: true,
    strict: false,
  });

  return !!match && match.params._id !== 'slug';
}
