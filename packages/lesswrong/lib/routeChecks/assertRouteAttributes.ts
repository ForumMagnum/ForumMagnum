import type { ParamMap } from '../../../../.next/types/routes';
import type { RoutePreviewPattern } from './hoverPreviewRoutes';
import type { PingbackRoutePattern } from './pingbackRoutes';
import type { LeftNavigationRoutePattern } from './index';
import type { MarkdownVersionRoutePattern } from './markdownVersionRoutes';
import type { WhiteBackgroundRoutePattern } from './routeBackgroundColors';

type NextExistingRoute = keyof ParamMap;

type RouteAttributes<Pathname extends NextExistingRoute> = {
  whiteBackground: Pathname extends WhiteBackgroundRoutePattern ? true : false,
  hasLinkPreview: Pathname extends RoutePreviewPattern ? true : false,
  hasPingbacks: Pathname extends PingbackRoutePattern ? true : false,
  hasLeftNavigationColumn: Pathname extends LeftNavigationRoutePattern ? true : false,
  hasMarkdownVersion: Pathname extends MarkdownVersionRoutePattern ? true : false,
};

/**
 * Assert that the given route has the specified attributes in various route-related
 * side tables (pingbacks, link previews, page background color, markdown variant, etc).
 * All attributes should refer to things in `packages/lesswrong/lib/routeChecks`.
 */
export function assertRouteAttributes<Pathname extends NextExistingRoute>(
  pathname: Pathname,
  routeAttributes: RouteAttributes<Pathname>
) {
  void pathname;
  void routeAttributes;
}
