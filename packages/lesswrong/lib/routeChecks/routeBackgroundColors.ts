/**
 * By default, pages have a slightly grayish background, which they place
 * pure-white boxes on top of (eg, the front page page). Some pages instead have
 * a pure-white background instead (eg, post pages).
 *
 * Because this is a handled by the root layout rather than the route component,
 * we have a list of white-background routes here. In the route component, call
 * assertRouteAttributes to enforce that route-attributes are consistent with
 * centralized route lists.
 */
import type { ParamMap } from '../../../../.next/types/routes';
import type { RoutePreviewPattern } from './hoverPreviewRoutes';
import type { PingbackRoutePattern } from './pingbackRoutes';
import type { LeftNavigationRoutePattern } from './index';

type NextExistingRoute = keyof ParamMap;

const routesWithWhiteBackground = [
  "/about",
  "/account",
  "/books/2018",
  "/books/2019",
  "/codex/[slug]",
  "/collaborateOnPost",
  "/contact",
  "/donate",
  "/drafts",
  "/editPost",
  "/events/[_id]/[slug]",
  "/events/[_id]",
  "/faq",
  "/g/[groupId]/p/[_id]",
  "/highlights/[slug]",
  "/hpmor/[slug]",
  "/login",
  "/manageSubscriptions",
  "/newPost",
  "/petrov/ceremony",
  "/postAnalytics",
  "/posts/[_id]/[slug]",
  "/posts/[_id]",
  "/posts/slug/[slug]",
  "/rationality/[slug]",
  "/resendVerificationEmail",
  "/s/[_id]/p/[postId]",
  "/search",
  "/users/[slug]/edit",
  "/w/[slug]",
  "/w/[slug]/discussion",
  "/w/create"
] as const satisfies readonly NextExistingRoute[];

type WhiteBackgroundRoutePattern = typeof routesWithWhiteBackground[number];

type RouteAttributes<Pathname extends NextExistingRoute> = {
  whiteBackground: Pathname extends WhiteBackgroundRoutePattern ? true : false,
  hasLinkPreview: Pathname extends RoutePreviewPattern ? true : false,
  hasPingbacks: Pathname extends PingbackRoutePattern ? true : false,
  hasLeftNavigationColumn: Pathname extends LeftNavigationRoutePattern ? true : false,
};

export function routeHasWhiteBackground(pathname: string): boolean {
  return isOnRoutesList(pathname, routesWithWhiteBackground);
}

function isOnRoutesList(pathname: string, routes: readonly string[]): boolean {
  const segments = pathname.split("/");
  for (const route of routes) {
    const routeSegments = route.split("/");
    if (segments.length === routeSegments.length
      && segments.every((s,i) => segments[i]===routeSegments[i] || routeSegments[i].startsWith("["))) {
      return true;
    }
  }
  return false;
}

export function assertRouteHasWhiteBackground(pathname: typeof routesWithWhiteBackground[number]) {
}

export function assertRouteAttributes<Pathname extends NextExistingRoute>(
  pathname: Pathname,
  routeAttributes: RouteAttributes<Pathname>
) {
  void pathname;
  void routeAttributes;
}
