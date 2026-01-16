import React from "react";
import UltraFeedPage from '@/components/pages/UltraFeedPage';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('LessWrong Feed'));
}

export default function Page() {
  return <RouteRoot metadata={{ subtitle: 'The Feed', hasLeftNavigationColumn: false }}>
    <UltraFeedPage />
  </RouteRoot>;
}
