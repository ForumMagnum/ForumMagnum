import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import LlmModelsPage from "@/components/languageModels/LlmModelsPage";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields("AI Models"), {
    robots: { index: false },
  });
}

assertRouteAttributes("/llmModels", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <LlmModelsPage />
  </RouteRoot>;
}
