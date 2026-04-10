import React from "react";
import SearchPageTabbed from '@/components/search/SearchPageTabbed';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Search'));
}

assertRouteAttributes("/search", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default function Page() {
  return <RouteRoot>
    <SearchPageTabbed />
  </RouteRoot>;
}
