import React from "react";
import TagCompareRevisions from '@/components/tagging/TagCompareRevisions';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getTagPageMetadataFunction } from "@/server/pageMetadata/tagPageMetadata";

export const generateMetadata = getTagPageMetadataFunction<{ slug: string }>(({ slug }) => slug);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ titleComponent: PostsPageHeaderTitle }} />
    <TagCompareRevisions />
  </>;
}
