import React from "react";
import LlmConversationsViewingPage from '@/components/languageModels/LlmConversationsViewingPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'LLM Conversations Viewer',
    robots: { index: false },
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'LLM Conversations', noFooter: true }} />
    <LlmConversationsViewingPage />
  </>;
}
