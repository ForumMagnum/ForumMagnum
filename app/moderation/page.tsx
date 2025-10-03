import React from "react";
import ModerationLog from '@/components/sunshineDashboard/moderationLog/ModerationLog';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Moderation Log',
    robots: { index: false },
  });
}

export default function Page() {
  return <RouteRoot>
    <ModerationLog />
  </RouteRoot>
}
