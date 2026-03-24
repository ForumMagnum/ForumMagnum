import React from "react";
import RandomTagPage from '@/components/tagging/RandomTagPage';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getPageTitleFields, mergeMetadata, noIndexMetadata } from "@/server/pageMetadata/sharedMetadata";

export const generateMetadata = () => mergeMetadata(getPageTitleFields('Random Wikitag'), noIndexMetadata);

assertRouteAttributes("/w/random", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot delayedStatusCode>
    <RandomTagPage />
  </RouteRoot>
}
