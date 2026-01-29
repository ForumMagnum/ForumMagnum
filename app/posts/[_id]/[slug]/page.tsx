import React from "react";
import PostsSingle from '../../../../packages/lesswrong/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { hasPostRecommendations } from "@/lib/betas";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

assertRouteHasWhiteBackground("/posts/[_id]/[slug]");

export default function PostPage() {
  return <RouteRoot
    delayedStatusCode
    metadata={{
      noFooter: hasPostRecommendations(),
    }}
  >
    <PostsSingle />
  </RouteRoot>;
}
