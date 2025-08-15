import React from "react";
import PostsSingle from '../../../../packages/lesswrong/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { PostsPageHeaderTitle } from "@/components/titles/PostsPageHeaderTitle";
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { hasPostRecommendations } from "@/lib/betas";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

export default function PostPage() {
  return <>
    <RouteMetadataSetter metadata={{
      background: 'white',
      noFooter: hasPostRecommendations,
      titleComponent: PostsPageHeaderTitle
    }} />
    <PostsSingle />
  </>;
}
