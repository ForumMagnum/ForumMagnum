import { isAF } from "../instanceSettings";
import { findNextConsistentRoutePatternMatch } from './nextRouteMatching';
import type { ParamMap } from '../../../../.next/types/routes';

type NextExistingRoute = keyof ParamMap;

function pathnameMatchesAnyOf(pathname: string, routePaths: NextExistingRoute[]) {
  return !!findNextConsistentRoutePatternMatch(pathname, routePaths);
}

export function pathnameMatchesRoutePath(pathname: string, routePath: NextExistingRoute) {
  return pathnameMatchesAnyOf(pathname, [routePath]);
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
  "/research",
  "/research/projects/[projectId]",
]);

export const isResearchRoute = (pathname: string) => pathnameMatchesAnyOf(pathname, [
  "/research",
  "/research/projects/[projectId]",
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

export const isPostsSingleRoute = (pathname: string) => pathnameMatchesAnyOf(pathname, [
  '/posts/[_id]',
  '/posts/[_id]/[slug]',
]);
