import React from "react";
import UltraFeedPage from '@/components/pages/UltraFeedPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'LessWrong Feed',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'The Feed', hasLeftNavigationColumn: false }} />
    <UltraFeedPage />
  </>;
}
