import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import { hasPostRecommendations } from "@/lib/betas";
import Loading from "@/components/vulcan-core/Loading";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

assertRouteHasWhiteBackground("/posts/[_id]");

export default async function PostsLoadingPage() {
  return <RouteRoot
    delayedStatusCode
    metadata={{
      noFooter: hasPostRecommendations(),
    }}
  >
    <Loading/>
  </RouteRoot>;
}

