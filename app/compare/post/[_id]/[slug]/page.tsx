import React from "react";
import PostsCompareRevisions from '@/components/posts/PostsCompareRevisions';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

export default function Page() {
  return <RouteRoot metadata={{ titleComponent: PostsPageHeaderTitle }}>
    <PostsCompareRevisions />
  </RouteRoot>;
}
