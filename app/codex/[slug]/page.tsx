import React from "react";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { PostsSingle, type PostPageSearchParams } from "@/components/posts/PostsSingle";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('SlateStarCodex'));
}

assertRouteAttributes("/codex/[slug]", {
  whiteBackground: true,
  hasLinkPreview: true,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<PostPageSearchParams>
}) {
  const { slug } = await params;
  return <RouteRoot delayedStatusCode subtitle={{
    title: 'SlateStarCodex',
    link: '/codex',
  }}>
    <PostsSingle slug={slug} collectionSlug="codex" searchParams={searchParams} />
  </RouteRoot>;
}
