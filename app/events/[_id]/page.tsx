import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { hasPostRecommendations } from "@/lib/betas";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

assertRouteHasWhiteBackground("/events/[_id]");

export default async function Page({ params }: { params: Promise<{ _id: string }> }) {
  const { _id } = await params;
  return <RouteRoot
    delayedStatusCode
    metadata={{
      subtitle: 'Community',
      subtitleLink: '/community',
      noFooter: hasPostRecommendations(),
    }}
  >
    <PostsSingle _id={_id} />
  </RouteRoot>;
}
