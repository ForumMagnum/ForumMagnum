import React from "react";
import PostsSingleSlug from '@/components/posts/PostsSingleSlug';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Rationality: A-Z'));
}

assertRouteAttributes("/rationality/[slug]", {
  whiteBackground: true,
  hasLinkPreview: true,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <RouteRoot delayedStatusCode
    subtitle={{ title: 'Rationality: A-Z', link: '/rationality' }}
  >
    <PostsSingleSlug slug={slug} />
  </RouteRoot>;
}
