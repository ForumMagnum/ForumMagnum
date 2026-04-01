import React from "react";
import { PostsSingle, type PostPageSearchParams } from '@/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => ({_id}));

assertRouteAttributes("/events/[_id]/[slug]", {
  whiteBackground: true,
  hasLinkPreview: true,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page({ params, searchParams }: {
  params: Promise<{ _id: string, slug: string }>
  searchParams: Promise<PostPageSearchParams>
}) {
  const { _id, slug } = await params;
  return <RouteRoot
    delayedStatusCode
    subtitle={{ title: 'Community', link: '/community' }}
  >
    <PostsSingle _id={_id} slug={slug} searchParams={searchParams} />
  </RouteRoot>;
}
