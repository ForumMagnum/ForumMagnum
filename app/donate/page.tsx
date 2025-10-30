import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

assertRouteHasWhiteBackground("/donate");

export default function Page() {
  return <RouteRoot delayedStatusCode>
    <PostsSingleRoute _id="LcpQQvcpWfPXvW7R9" />
  </RouteRoot>;
}
