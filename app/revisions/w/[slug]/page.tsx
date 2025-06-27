import React from "react";
import TagPageRevisionSelect from '@/components/revisions/TagPageRevisionSelect';
import { TagPageTitle } from '@/components/tagging/TagPageTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ titleComponent: TagPageTitle }} />
    <TagPageRevisionSelect />
  </>;
}
