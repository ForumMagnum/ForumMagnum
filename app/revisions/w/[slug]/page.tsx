import React from "react";
import TagPageRevisionSelect from '@/components/revisions/TagPageRevisionSelect';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default function Page() {
  return <RouteRoot metadata={{ titleComponent: TagPageTitle }}>
    <TagPageRevisionSelect />
  </RouteRoot>;
}
