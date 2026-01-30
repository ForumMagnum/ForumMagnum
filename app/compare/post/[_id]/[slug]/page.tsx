import React from "react";
import PostsCompareRevisions from '@/components/posts/PostsCompareRevisions';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

export default function Page() {
  return <RouteRoot>
    <PostsCompareRevisions />
  </RouteRoot>;
}
