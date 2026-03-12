import React from "react";
import NotificationEmailPreviewPage from '@/components/notifications/NotificationEmailPreviewPage';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

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
