import React from "react";
import InboxWrapper from '@/components/messaging/InboxWrapper';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Inbox',
  });
}

export default function Page() {
  return <InboxWrapper />;
}
