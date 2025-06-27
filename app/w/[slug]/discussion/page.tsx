import React from "react";
import TagDiscussionPage from '@/components/tagging/TagDiscussionPage';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";

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
