import React from "react";
import LibraryPage from '@/components/sequences/LibraryPage';
import { getDefaultMetadata, getPageTitleFields, getResolverContextForServerComponent } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import AFLibraryPage from "@/components/alignment-forum/AFLibraryPage";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('The Library'));
}

assertRouteAttributes("/library", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: true,
  hasMarkdownVersion: false,
});

export default async function Page({ searchParams }: { searchParams: Promise<{}> }) {
  const context = await getResolverContextForServerComponent(await searchParams);
  return <RouteRoot>
    {context.isAF ? <AFLibraryPage /> : <LibraryPage />}
  </RouteRoot>;
}
