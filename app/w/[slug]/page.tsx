import React from "react";
import TagPageRouter from '@/components/tagging/TagPageRouter';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default function Page() {
  // enableResourcePrefetch was: function
  
  return <RouteRoot metadata={{
    background: 'white',
    titleComponent: TagPageTitle,
    subtitleComponent: TagPageTitle
  }}>
    <TagPageRouter />
  </RouteRoot>
}
