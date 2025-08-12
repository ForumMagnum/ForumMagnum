import React from "react";
import InboxWrapper from '@/components/messaging/InboxWrapper';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Inbox'));
}

export default function Page() {
  return <InboxWrapper />;
}
