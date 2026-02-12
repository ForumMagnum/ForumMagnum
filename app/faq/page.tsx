import React from "react";
import PostsSingleRoute from '@/components/posts/PostsSingleRoute';
import RouteRoot from "@/components/layout/RouteRoot";
import { faqPostIdSetting } from "@/lib/instanceSettings";
import { assertRouteHasWhiteBackground } from "@/lib/routeChecks/routeBackgroundColors";

assertRouteHasWhiteBackground("/faq");

export default function Page() {
  return <RouteRoot delayedStatusCode>
    <PostsSingleRoute _id={faqPostIdSetting.get()} />
  </RouteRoot>;
}
