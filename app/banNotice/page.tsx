import React from "react";
import BannedNotice from '@/components/users/BannedNotice';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getPageTitleFields, mergeMetadata, noIndexMetadata } from "@/server/pageMetadata/sharedMetadata";

export const generateMetadata = () => mergeMetadata(getPageTitleFields('Banned Notice'), noIndexMetadata);

assertRouteAttributes("/banNotice", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <BannedNotice />;
  </RouteRoot>
}
