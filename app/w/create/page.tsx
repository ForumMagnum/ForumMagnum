import React from "react";
import NewTagPage from '@/components/tagging/NewTagPage';
import { TagPageSubtitle } from '@/components/tagging/TagPageSubtitle';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('New Wikitag'));
}

assertRouteAttributes("/w/create", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot subtitle={TagPageSubtitle}>
    <NewTagPage />
  </RouteRoot>;
}
