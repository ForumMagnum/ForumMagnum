import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/layout/RouteRoot";
import { aboutPostIdSetting } from "@/lib/instanceSettings";
import { assertRouteHasWhiteBackground } from "@/lib/routeChecks/routeBackgroundColors";

assertRouteHasWhiteBackground("/about");

export default function Page() {
  return <RouteRoot delayedStatusCode>
    <PostsSingleRoute _id={aboutPostIdSetting.get()} />
  </RouteRoot>;
}
