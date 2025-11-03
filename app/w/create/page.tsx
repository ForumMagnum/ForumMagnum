import React from "react";
import NewTagPage from '@/components/tagging/NewTagPage';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'New Wikitag',
  });
}

assertRouteHasWhiteBackground("/w/create");

export default function Page() {
  return <RouteRoot metadata={{ subtitleComponent: TagPageTitle }}>
    <NewTagPage />
  </RouteRoot>;
}
