import React from "react";
import ModeratorInboxWrapper from '@/components/messaging/ModeratorInboxWrapper';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge(defaultMetadata, {
    title: 'Moderator Inbox',
  });
}

export default function Page() {
  return <ModeratorInboxWrapper />;
}
