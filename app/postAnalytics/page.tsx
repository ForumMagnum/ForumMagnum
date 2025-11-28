import React from "react";
import PostsAnalyticsPage from '@/components/analytics/PostsAnalyticsPage';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

assertRouteHasWhiteBackground("/postAnalytics");

export default function Page() {
  return <RouteRoot>
    <PostsAnalyticsPage />
  </RouteRoot>;
}
