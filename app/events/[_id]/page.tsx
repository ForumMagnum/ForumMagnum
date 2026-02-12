import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { hasPostRecommendations } from "@/lib/betas";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

assertRouteAttributes("/events/[_id]", {
  whiteBackground: true,
  hasLinkPreview: true,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ params }: { params: Promise<{ _id: string }> }) {
  const { _id } = await params;
  return <RouteRoot
    delayedStatusCode
    subtitle={{ title: 'Community', link: '/community' }}
    noFooter={hasPostRecommendations()}
  >
    <PostsSingle _id={_id} />
  </RouteRoot>;
}
