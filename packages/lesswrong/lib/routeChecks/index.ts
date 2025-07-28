// eslint-disable-next-line no-restricted-imports
import { matchPath } from 'react-router'
import { isAF, taggingNamePluralSetting } from "../instanceSettings";

function pathnameMatchesRoutePath(pathname: string, routePath: string) {
  return !!matchPath(pathname, {
    path: routePath,
    exact: true,
    strict: false,
  });
}

export const isHomeRoute = (pathname: string) => pathnameMatchesRoutePath(pathname, '/') && !isAF;

export const isSunshineSidebarRoute = (pathname: string) => pathnameMatchesRoutePath(pathname, '/');

export const isStandaloneRoute = (pathname: string) => ['/crosspostLogin', '/groups-map'].some(route => pathnameMatchesRoutePath(pathname, route));

export const isStaticHeaderRoute = (pathname: string) => pathnameMatchesRoutePath(pathname, '/admin/digests/:num');

export const isFullscreenRoute = (pathname: string) => ["/inbox", "/moderatorInbox", "/conversation"].some(route => pathnameMatchesRoutePath(pathname, route));

export const isUnspacedGridRoute = (pathname: string) => {
  // Check for the subforum2 route pattern
  const routePath = `/${taggingNamePluralSetting.get()}/:slug/subforum2`;
  return pathnameMatchesRoutePath(pathname, routePath);
};

export const isPostsSingleRoute = (pathname: string) => {
  const match = matchPath(pathname, {
    path: '/posts/:_id/:slug?',
    exact: true,
    strict: false,
  });

  return match && (match.params as { _id: string })._id !== 'slug';
}
