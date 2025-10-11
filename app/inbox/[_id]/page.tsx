import React from "react";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";
import InboxWrapper from "@/components/messaging/InboxWrapper";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Private Conversation'));
}

export default function Page() {
  return <RouteRoot>
    <InboxWrapper />
  </RouteRoot>
}
