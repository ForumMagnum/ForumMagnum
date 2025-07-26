import React from "react";
import InboxWrapper from '@/components/messaging/InboxWrapper';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Inbox',
  });
}

export default function Page() {
  return <InboxWrapper />;
}
