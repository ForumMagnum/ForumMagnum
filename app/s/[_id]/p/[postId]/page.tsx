import React from "react";
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { PostsSingle, type PostPageSearchParams } from "@/components/posts/PostsSingle";

assertRouteAttributes("/s/[_id]/p/[postId]", {
  whiteBackground: true,
  hasLinkPreview: true,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export const generateMetadata = getPostPageMetadataFunction<{ _id: string; postId: string }>(({ postId }) => postId);

export default async function Page({ params, searchParams }: {
  params: Promise<{ _id: string; postId: string }>
  searchParams: Promise<PostPageSearchParams>
}) {
  const { _id, postId } = await params;
  return <RouteRoot>
    <PostsSingle idOrSlug={postId} sequenceId={_id} searchParams={searchParams} />
  </RouteRoot>;
}
