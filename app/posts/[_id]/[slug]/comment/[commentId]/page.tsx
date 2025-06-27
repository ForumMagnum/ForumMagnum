import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id, { noIndex: true });

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ noFooter: false, titleComponent: PostsPageHeaderTitle }} />
    <PostsSingle />
  </>;
}
