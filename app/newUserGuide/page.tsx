import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/layout/RouteRoot";
import { aboutPostIdSetting, newUserGuideId } from "@/lib/instanceSettings";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/newUserGuide", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default function Page() {
  return <RouteRoot delayedStatusCode>
    <PostsSingleRoute _id={newUserGuideId.get()} />
  </RouteRoot>;
}
