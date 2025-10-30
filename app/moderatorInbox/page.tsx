import React from "react";
import ModeratorInboxWrapper from '@/components/messaging/ModeratorInboxWrapper';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Moderator Inbox',
  });
}

export default function Page() {
  return <RouteRoot metadata={{noFooter: true}}>
    <ModeratorInboxWrapper />
  </RouteRoot>
}
