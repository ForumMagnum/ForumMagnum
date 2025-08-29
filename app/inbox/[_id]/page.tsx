import React from "react";
import ConversationWrapper from '@/components/messaging/ConversationWrapper';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Private Conversation',
  });
}

export default function Page() {
  return <RouteRoot metadata={{ background: 'white' }}>
    <ConversationWrapper />
  </RouteRoot>;
}
