import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import NotificationsPage from '@/components/notifications/NotificationsPage';
import RouteRoot from "@/components/layout/RouteRoot";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Notifications'));
}

assertRouteAttributes("/notifications", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <NotificationsPage />
  </RouteRoot>;
}
