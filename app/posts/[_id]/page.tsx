import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { hasPostRecommendations } from "@/lib/betas";
import RouteRoot from "@/components/next/RouteRoot";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.postPage;

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

export default function Page() {
  // enableResourcePrefetch was: function
  
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
