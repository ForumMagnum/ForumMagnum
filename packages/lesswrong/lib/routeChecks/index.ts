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

export const isFullscreenRoute = (pathname: string) => pathnameMatchesAnyOf(pathname, [
  "/inbox",
  "/inbox/[conversationId]",
  "/moderatorInbox",
]);

const routesWithLeftNavigationColumn = [
  "/allPosts",
  "/questions",
  "/quicktakes",
  "/collections/[_id]",
  "/library",
] as const satisfies readonly NextExistingRoute[];

export type LeftNavigationRoutePattern = typeof routesWithLeftNavigationColumn[number];

export const isRouteWithLeftNavigationColumn = (pathname: string) => pathnameMatchesAnyOf(pathname, [...routesWithLeftNavigationColumn]);

export const isPostsSingleRoute = (pathname: string) => {
  const match = matchPath<{ _id: string }>(pathname, {
    path: ['/posts/[_id]', '/posts/[_id]/[slug]'].map(routePatternToReactRouterPath),
    exact: true,
    strict: false,
  });

  return !!match && match.params._id !== 'slug';
}
