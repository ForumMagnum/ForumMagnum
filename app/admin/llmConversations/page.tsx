import React from "react";
import LlmConversationsViewingPage from '@/components/languageModels/LlmConversationsViewingPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'LLM Conversations Viewer',
    robots: { index: false },
  });
}

export default function Page() {
  return <RouteRoot metadata={{ subtitle: 'LLM Conversations', noFooter: true }}>
    <LlmConversationsViewingPage />
  </RouteRoot>;
}
