import React from "react";
import TagDiscussionPage from '@/components/tagging/TagDiscussionPage';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";

// TODO: This route has both a titleComponent and static metadata ({ noIndex: false })!  You will need to manually merge the two.

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{
      background: 'white',
      titleComponent: TagPageTitle,
      subtitleComponent: TagPageTitle
    }} />
    <TagDiscussionPage />
  </>;
}
