import React from "react";
import PostsRevisionSelect from '@/components/revisions/PostsRevisionSelect';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string; slug: string }>(({ _id }) => _id);

export default function Page() {
  return <RouteRoot metadata={{ titleComponent: PostsPageHeaderTitle }}>
    <PostsRevisionSelect />
  </RouteRoot>;
}
