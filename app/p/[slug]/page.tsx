import React from "react";
import { PostsSingle, type PostPageSearchParams } from '@/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export const generateMetadata = getPostPageMetadataFunction<{ slug: string }>(({ slug }) => ({idOrSlug: slug}));

assertRouteAttributes("/p/[slug]", {
  whiteBackground: true,
  hasLinkPreview: true,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<PostPageSearchParams>
}) {
  const { slug } = await params;

  return <RouteRoot
    delayedStatusCode
  >
    <PostsSingle idOrSlug={slug} searchParams={searchParams} />
  </RouteRoot>;
}
