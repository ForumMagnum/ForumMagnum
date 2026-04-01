import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import QueryLogVisualizer from "@/components/admin/QueryLogVisualizer";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { getPageTitleFields, mergeMetadata } from "@/server/pageMetadata/sharedMetadata";

export const generateMetadata = () => mergeMetadata(getPageTitleFields("Query Log Visualizer"));

assertRouteAttributes("/debug/query-waterfall", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return (
    <RouteRoot>
      <QueryLogVisualizer />
    </RouteRoot>
  );
}

