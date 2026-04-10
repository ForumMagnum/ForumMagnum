import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

assertRouteAttributes("/events/[_id]/[slug]", {
  whiteBackground: true,
  hasLinkPreview: true,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page({ params }: {
  params: Promise<{ _id: string, slug: string }>
}) {
  const { _id, slug } = await params;
  return <RouteRoot
    delayedStatusCode
    subtitle={{ title: 'Community', link: '/community' }}
  >
    <PostsSingle _id={_id} slug={slug} />
  </RouteRoot>;
}
