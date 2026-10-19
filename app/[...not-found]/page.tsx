import React from 'react';
import Error404 from '@/components/common/Error404';
import RouteRoot from '@/components/layout/RouteRoot';
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/[...not-found]", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

// Render the not-found UI directly rather than calling notFound(): a
// notFound() thrown mid-stream can't affect the HTTP status, whereas
// rendering Error404 emits the StatusCodeSetter marker that the middleware
// turns into a real 404 (or a redirect, for miscapitalized routes).
export default function NotFound() {
  return <RouteRoot delayedStatusCode>
    <Error404/>
  </RouteRoot>;
}
