import React from "react";
import TagPageRouter from '@/components/tagging/TagPageRouter';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default function Page() {
  // enableResourcePrefetch was: function
  
  return <>
    <RouteMetadataSetter metadata={{
      background: 'white',
      titleComponent: TagPageTitle,
      subtitleComponent: TagPageTitle
    }} />
    <TagPageRouter />
  </>;
}
