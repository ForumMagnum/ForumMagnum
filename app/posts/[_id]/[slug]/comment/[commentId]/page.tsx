import React from "react";
import { PostsSingle, type PostPageSearchParams } from '@/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id, { noIndex: true });

assertRouteAttributes("/posts/[_id]/[slug]/comment/[commentId]", {
  whiteBackground: false,
  hasLinkPreview: true,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page({ params, searchParams }: {
  params: Promise<{ _id: string, slug: string, commentId: string }>
  searchParams: Promise<PostPageSearchParams>
}) {
  const { _id, slug, commentId } = await params;
  return <RouteRoot delayedStatusCode>
    <PostsSingle _id={_id} slug={slug} searchParams={searchParams} />
  </RouteRoot>;
}
