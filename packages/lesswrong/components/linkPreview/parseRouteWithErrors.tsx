import { routePreviewComponentMapping } from '@/lib/routeChecks/hoverPreviewRoutes';
import { parseRoute, parsePath } from '@/lib/routeChecks/parseRoute';

export const parseRouteWithErrors = <const T extends string[] | [] = []>(onsiteUrl: string, extraRoutePatterns?: T) => {
  return parseRoute<((keyof typeof routePreviewComponentMapping) | T[number])[]>({
    location: parsePath(onsiteUrl),
    onError: (pathname) => {
      // Don't capture broken links in Sentry (too spammy, but maybe we'll
      // put this back some day).
      //if (isClient) {
      //  if (contentSourceDescription)
      //    Sentry.captureException(new Error(`Broken link from ${contentSourceDescription} to ${pathname}`));
      //  else
      //    Sentry.captureException(new Error(`Broken link from ${location.pathname} to ${pathname}`));
      //}
    },
    routePatterns: [
      ...Object.keys(routePreviewComponentMapping).reverse() as (keyof typeof routePreviewComponentMapping)[],
      ...(extraRoutePatterns ?? [])
    ]
  });
};
