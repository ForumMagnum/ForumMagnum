import React from "react";
import { LlmConversationsViewingPage } from '@/components/languageModels/LlmConversationsViewingPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('LLM Conversations Viewer'), {
    robots: { index: false },
  });
}

export default function Page() {
  return <RouteRoot metadata={{ subtitle: 'LLM Conversations', noFooter: true }}>
    <LlmConversationsViewingPage />
  </RouteRoot>;
}
