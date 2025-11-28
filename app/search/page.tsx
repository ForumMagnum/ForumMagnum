import React from "react";
import SearchPageTabbed from '@/components/search/SearchPageTabbed';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Search'));
}

assertRouteHasWhiteBackground("/search");

export default function Page() {
  return <RouteRoot>
    <SearchPageTabbed />
  </RouteRoot>;
}
