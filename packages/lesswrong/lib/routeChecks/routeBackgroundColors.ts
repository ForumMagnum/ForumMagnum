/**
 * By default, pages have a slightly grayish background, which they place
 * pure-white boxes on top of (eg, the front page page). Some pages instead have
 * a pure-white background instead (eg, post pages).
 *
 * Because this is a handled by the root layout rather than the route component,
 * we have a list of white-background routes here. In the route component, call
 * assertRouteHasWhiteBackground to enforce that it's in this list.
 */
const routesWithWhiteBackground = [
  "/about",
  "/account",
  "/bestoflesswrong/2018",
  "/bestoflesswrong/2019",
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
  "/posts/slug",
  "/rationality/[slug]",
  "/resendVerificationEmail",
  "/s/[_id]/p/[postId]",
  "/search",
  "/users/[slug]/edit",
  "/w/[slug]",
  "/w/[slug]/discussion",
  "/w/create"
] as const;

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
