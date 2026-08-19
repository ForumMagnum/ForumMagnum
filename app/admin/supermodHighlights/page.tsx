import React from "react";
import HighlightRuleEditorPage from "@/components/sunshineDashboard/supermod/HighlightRuleEditorPage";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Supermod Highlight Rules'), {
    robots: { index: false },
  });
}

assertRouteAttributes("/admin/supermodHighlights", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasMarkdownVersion: false,
  hasLeftNavigationColumn: false,
});

export default function Page() {
  return <RouteRoot>
    <HighlightRuleEditorPage />
  </RouteRoot>;
}
