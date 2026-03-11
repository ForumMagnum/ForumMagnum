import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import LinkPreviewTester from "./LinkPreviewTester";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

assertRouteAttributes("/debug/linkPreview", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return (
    <RouteRoot>
      <LinkPreviewTester />
    </RouteRoot>
  );
}

