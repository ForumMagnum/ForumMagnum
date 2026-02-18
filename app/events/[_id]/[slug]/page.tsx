import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { hasPostRecommendations } from "@/lib/betas";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/lib/routeChecks/routeBackgroundColors";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

assertRouteHasWhiteBackground("/events/[_id]/[slug]");

export default async function Page({ params }: {
  params: Promise<{ _id: string, slug: string }>
}) {
  const { _id, slug } = await params;
  return <RouteRoot
    delayedStatusCode
    subtitle={{ title: 'Community', link: '/community' }}
    noFooter={hasPostRecommendations()}
  >
    <PostsSingle _id={_id} slug={slug} />
  </RouteRoot>;
}
