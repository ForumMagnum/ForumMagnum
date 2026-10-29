import React from "react";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import LlmRepliesPage from "@/components/languageModels/LlmRepliesPage";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), await getPageTitleFields("AI Replies"), {
    robots: { index: false },
  });
}

assertRouteAttributes("/llmReplies", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <LlmRepliesPage />
  </RouteRoot>;
}
