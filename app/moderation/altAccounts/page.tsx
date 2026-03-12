import React from "react";
import ModerationAltAccounts from '@/components/sunshineDashboard/ModerationAltAccounts';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

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
