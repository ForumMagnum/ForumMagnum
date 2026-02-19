import React from "react";
import { LlmConversationsViewingPage } from '@/components/languageModels/LlmConversationsViewingPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('LLM Conversations Viewer'), {
    robots: { index: false },
  });
}

assertRouteAttributes("/admin/llmConversations", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot subtitle="LLM Conversations" noFooter>
    <LlmConversationsViewingPage />
  </RouteRoot>;
}
