import React from "react";
import TagCompareRevisions from '@/components/tagging/TagCompareRevisions';
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default function Page() {
  return <RouteRoot>
    <TagCompareRevisions />
  </RouteRoot>;
}
