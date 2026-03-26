import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import Loading from "@/components/vulcan-core/Loading";
import { assertRouteHasWhiteBackground } from "@/lib/routeChecks/routeBackgroundColors";

assertRouteHasWhiteBackground("/posts/[_id]");

export default async function PostsLoadingPage() {
  return <RouteRoot
    delayedStatusCode
  >
    <Loading/>
  </RouteRoot>;
}

