import React from "react";
import DigestEmailPreviewPage from "@/components/notifications/DigestEmailPreviewPage";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/debug/digestEmailPreview", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return (
    <RouteRoot>
      <DigestEmailPreviewPage />
    </RouteRoot>
  );
}
