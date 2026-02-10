import { matchPath } from '../vendor/react-router/matchPath';
import { isAF, taggingNamePluralSetting } from "../instanceSettings";
import { routePatternToReactRouterPath } from './routePatternFormat';

function pathnameMatchesRoutePath(pathname: string, routePath: string) {
  return !!matchPath(pathname, {
    path: routePatternToReactRouterPath(routePath),
    exact: true,
    strict: false,
  });
}

export const isHomeRoute = (pathname: string) => pathnameMatchesRoutePath(pathname, '/') && !isAF();

export const isSunshineSidebarRoute = (pathname: string) => pathnameMatchesRoutePath(pathname, '/');

export const isStandaloneRoute = (pathname: string) => ['/crosspostLogin', '/groups-map'].some(route => pathnameMatchesRoutePath(pathname, route));

export const isStaticHeaderRoute = (pathname: string) => pathnameMatchesRoutePath(pathname, '/admin/digests/[num]');

export const isFullscreenRoute = (pathname: string) => ["/inbox", "/inbox/[conversationId]", "/moderatorInbox", "/conversation"].some(route => pathnameMatchesRoutePath(pathname, route));

export const isRouteWithLeftNavigationColumn = (pathname: string) => [
  "/",
  "/allPosts",
  "/questions",
  "/quicktakes",
  "/collections/[_id]",
  "/library",
].some(route => pathnameMatchesRoutePath(pathname, route));

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
