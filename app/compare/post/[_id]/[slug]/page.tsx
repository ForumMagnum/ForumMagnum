import React from "react";
import PostsCompareRevisions from '@/components/posts/PostsCompareRevisions';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ titleComponent: PostsPageHeaderTitle }} />
    <PostsCompareRevisions />
  </>;
}
