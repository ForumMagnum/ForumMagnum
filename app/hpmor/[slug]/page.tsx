import React from "react";
import PostsSingleSlug from '@/components/posts/PostsSingleSlug';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('HPMoR'));
}

assertRouteHasWhiteBackground("/hpmor/[slug]");

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <RouteRoot delayedStatusCode metadata={{ subtitle: 'HPMoR', subtitleLink: '/hpmor' }}>
    <PostsSingleSlug slug={slug} />
  </RouteRoot>;
}
