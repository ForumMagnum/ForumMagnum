import React from "react";
import CommunityHome from '@/components/localGroups/CommunityHome';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Community'));
}

assertRouteAttributes("/community", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default function Page() {
  return <RouteRoot subtitle={{
    title: 'Community',
    link: '/community'
  }}>
    <CommunityHome />
  </RouteRoot>;
}
