import React from "react";
import TagHistoryPage from '@/components/tagging/history/TagHistoryPage';
import { TagHistoryPageTitle } from '@/components/tagging/TagHistoryPageTitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug, { historyPage: true, noIndex: true });

export default function Page() {
  // enableResourcePrefetch was: function
  
  return <RouteRoot metadata={{
    titleComponent: TagHistoryPageTitle,
    subtitleComponent: TagHistoryPageTitle
  }}>
    <TagHistoryPage />
  </RouteRoot>;
}
