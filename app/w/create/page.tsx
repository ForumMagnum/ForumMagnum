import React from "react";
import NewTagPage from '@/components/tagging/NewTagPage';
import { TagPageSubtitle } from '@/components/tagging/TagPageSubtitle';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('New Wikitag'));
}

assertRouteHasWhiteBackground("/w/create");

export default function Page() {
  return <RouteRoot metadata={{ subtitleComponent: TagPageSubtitle }}>
    <NewTagPage />
  </RouteRoot>;
}
