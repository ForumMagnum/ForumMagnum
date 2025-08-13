import PostsSingle from "@/components/posts/PostsSingle";
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { PostsPageHeaderTitle } from "@/components/titles/PostsPageHeaderTitle";
import { hasPostRecommendations } from "@/lib/betas";
import React from "react";

export default function PostsLoadingPage() {
  <RouteMetadataSetter metadata={{
    background: 'white',
    noFooter: hasPostRecommendations,
    titleComponent: PostsPageHeaderTitle
  }} />
  return <PostsSingle />;
}
