import React from "react";
import { EmailHistoryPage } from '@/components/sunshineDashboard/EmailHistory';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getPageTitleFields, mergeMetadata } from "@/server/pageMetadata/sharedMetadata";

export const generateMetadata = () => mergeMetadata(getPageTitleFields("Email History"));

assertRouteAttributes("/debug/emailHistory", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <EmailHistoryPage />
  </RouteRoot>
}
