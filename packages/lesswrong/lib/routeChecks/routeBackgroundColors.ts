/**
 * By default, pages have a slightly grayish background, which they place
 * pure-white boxes on top of (eg, the front page page). Some pages instead have
 * a pure-white background instead (eg, post pages).
 *
 * A third tier, "cream", is used for pages with a warm off-white background
 * (eg, the profile page).
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
  "/newUserGuide",
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

export type WhiteBackgroundRoutePattern = typeof routesWithWhiteBackground[number];

const routesWithCreamBackground = [
  "/users/[slug]",
] as const;

export function routeHasWhiteBackground(pathname: string): boolean {
  return isOnRoutesList(pathname, routesWithWhiteBackground);
}

export function routeHasCreamBackground(pathname: string): boolean {
  return isOnRoutesList(pathname, routesWithCreamBackground);
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
