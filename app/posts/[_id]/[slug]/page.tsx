import React from "react";
import PostsSingle from '../../../../packages/lesswrong/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { PostsPageHeaderTitle } from "@/components/titles/PostsPageHeaderTitle";
import { hasPostRecommendations } from "@/lib/betas";
import RouteRoot from "@/components/next/RouteRoot";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

export default function PostPage() {
  return <RouteRoot
    delayedStatusCode
    metadata={{
      background: 'white',
      noFooter: hasPostRecommendations(),
      titleComponent: PostsPageHeaderTitle
    }}
  >
    <PostsSingle />
  </RouteRoot>;
}
