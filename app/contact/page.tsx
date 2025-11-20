import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/layout/RouteRoot";
import { contactPostIdSetting } from "@/lib/instanceSettings";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

assertRouteHasWhiteBackground("/contact");

export default function Page() {
  return <RouteRoot delayedStatusCode>
    <PostsSingleRoute _id={contactPostIdSetting.get()} />
  </RouteRoot>;
}
