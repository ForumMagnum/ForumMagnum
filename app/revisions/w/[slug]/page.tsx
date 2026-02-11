import React from "react";
import TagPageRevisionSelect from '@/components/revisions/TagPageRevisionSelect';
import { TagPageSubtitle } from '@/components/tagging/TagPageSubtitle';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default function Page() {
  return <RouteRoot subtitle={TagPageSubtitle}>
    <TagPageRevisionSelect />
  </RouteRoot>;
}
