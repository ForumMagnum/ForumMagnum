import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import PostsPageLoadingPreview from "@/components/posts/PostsPage/PostsPageLoadingPreview";
import { assertRouteHasWhiteBackground } from "@/lib/routeChecks/routeBackgroundColors";

assertRouteHasWhiteBackground("/posts/[_id]");

export default async function PostsLoadingPage() {
  return <RouteRoot
    delayedStatusCode
  >
    <PostsPageLoadingPreview/>
  </RouteRoot>;
}
