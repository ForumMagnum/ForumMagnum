import React from "react";
import TagHistoryPage from '@/components/tagging/history/TagHistoryPage';
import { TagHistoryPageTitle } from '@/components/tagging/TagHistoryPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";

// TODO: This route has both a titleComponent and static metadata ({ noIndex: true })!  You will need to manually merge the two.

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug, { historyPage: true });

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
