import React from "react";
import RouteRoot from "@/components/next/RouteRoot";
import PostsSingle from "@/components/posts/PostsSingle";
import { PostsPageHeaderTitle } from "@/components/titles/PostsPageHeaderTitle";
import { hasPostRecommendations } from "@/lib/betas";

export default async function PostsLoadingPage() {
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

