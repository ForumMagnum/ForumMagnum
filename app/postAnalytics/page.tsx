import React from "react";
import PostsAnalyticsPage from '@/components/analytics/PostsAnalyticsPage';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";
import merge from "lodash/merge";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";

assertRouteHasWhiteBackground("/postAnalytics");

export async function generateMetadata(): Promise<Metadata> {
  // ea-forum-look-here TODO Get post ID from search params and get post title
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Post Analytics'));
}


export default function Page() {
  return <RouteRoot>
    <PostsAnalyticsPage />
  </RouteRoot>;
}
