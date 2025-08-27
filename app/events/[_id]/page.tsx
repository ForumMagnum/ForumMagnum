import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { hasPostRecommendations } from "@/lib/betas";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{
      subtitle: 'Community',
      subtitleLink: '/community',
      background: 'white',
      noFooter: hasPostRecommendations(),
      titleComponent: PostsPageHeaderTitle
    }} />
    <PostsSingle />
  </>;
}
