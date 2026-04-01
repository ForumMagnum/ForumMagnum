import React from "react";
import { PostsSingle, type PostPageSearchParams } from '@/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => ({idOrSlug: _id}));

assertRouteAttributes("/posts/[_id]", {
  whiteBackground: true,
  hasLinkPreview: true,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page({ params, searchParams }: {
  params: Promise<{ _id: string }>,
  searchParams: Promise<PostPageSearchParams>
}) {
  const { _id } = await params;

  return <RouteRoot
    delayedStatusCode
  >
    <PostsSingle idOrSlug={_id} searchParams={searchParams} />
  </RouteRoot>;
}
