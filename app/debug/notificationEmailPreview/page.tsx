import React from "react";
import NotificationEmailPreviewPage from '@/components/notifications/NotificationEmailPreviewPage';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getPageTitleFields, mergeMetadata } from "@/server/pageMetadata/sharedMetadata";

export const generateMetadata = () => mergeMetadata(getPageTitleFields("Notification Email Preview"));

assertRouteAttributes("/debug/notificationEmailPreview", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <NotificationEmailPreviewPage />
  </RouteRoot>
}
