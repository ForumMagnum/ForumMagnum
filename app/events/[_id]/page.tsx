import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { hasPostRecommendations } from "@/lib/betas";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

assertRouteHasWhiteBackground("/events/[_id]");

export default function Page() {
  return <RouteRoot
    delayedStatusCode
    metadata={{
      subtitle: 'Community',
      subtitleLink: '/community',
      noFooter: hasPostRecommendations(),
      titleComponent: PostsPageHeaderTitle
    }}
  >
    <PostsSingle />
  </RouteRoot>;
}
