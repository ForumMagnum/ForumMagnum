import React from "react";
import PostsRevisionSelect from '@/components/revisions/PostsRevisionSelect';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string; slug: string }>(({ _id }) => _id);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ titleComponent: PostsPageHeaderTitle }} />
    <PostsRevisionSelect />
  </>;
}
