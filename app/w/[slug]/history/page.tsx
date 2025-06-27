import React from "react";
import TagHistoryPage from '@/components/tagging/history/TagHistoryPage';
import { TagHistoryPageTitle } from '@/components/tagging/TagHistoryPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug, { historyPage: true, noIndex: true });

export default function Page() {
  // enableResourcePrefetch was: function
  
  return <>
    <RouteMetadataSetter metadata={{
      titleComponent: TagHistoryPageTitle,
      subtitleComponent: TagHistoryPageTitle
    }} />
    <TagHistoryPage />
  </>;
}
