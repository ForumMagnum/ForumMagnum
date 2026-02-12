import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { PetrovDayPage } from "@/components/seasonal/petrovDay/petrov-day-story/PetrovDayStory";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Petrov Day'));
}

assertRouteAttributes("/petrov/ceremony", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function PetrovDayStoryPage() {
  return <RouteRoot noFooter>
    <PetrovDayPage />
  </RouteRoot>;
}
