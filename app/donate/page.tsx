import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/lib/routeChecks/routeBackgroundColors";

assertRouteHasWhiteBackground("/donate");

export default function Page() {
  return <RouteRoot delayedStatusCode>
    <PostsSingleRoute _id="LcpQQvcpWfPXvW7R9" />
  </RouteRoot>;
}
