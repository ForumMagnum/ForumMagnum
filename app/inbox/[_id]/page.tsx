import React from "react";
import ConversationWrapper from '@/components/messaging/ConversationWrapper';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Private Conversation',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <ConversationWrapper />
  </>;
}
