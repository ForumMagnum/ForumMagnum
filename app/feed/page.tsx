import React from "react";
import UltraFeedPage from '@/components/pages/UltraFeedPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'LessWrong Feed',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'The Feed', hasLeftNavigationColumn: false }} />
    <UltraFeedPage />
  </>;
}
