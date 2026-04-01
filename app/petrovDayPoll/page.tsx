import React from "react";
import PetrovDayPoll from '@/components/seasonal/petrovDay/PetrovDayPoll';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getPageTitleFields, mergeMetadata, noIndexMetadata } from "@/server/pageMetadata/sharedMetadata";

export const generateMetadata = () => mergeMetadata(getPageTitleFields('Petrov Day Poll'), noIndexMetadata);

assertRouteAttributes("/petrovDayPoll", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <PetrovDayPoll />
  </RouteRoot>
}
