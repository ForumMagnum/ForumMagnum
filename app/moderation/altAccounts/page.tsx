import React from "react";
import ModerationAltAccounts from '@/components/sunshineDashboard/ModerationAltAccounts';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getPageTitleFields, mergeMetadata, noIndexMetadata } from "@/server/pageMetadata/sharedMetadata";

export const generateMetadata = () => mergeMetadata(getPageTitleFields("Alt Accounts Investigator"), noIndexMetadata);

assertRouteAttributes("/moderation/altAccounts", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <ModerationAltAccounts />
  </RouteRoot>
}
