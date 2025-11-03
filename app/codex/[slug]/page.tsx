import React from "react";
import PostsSingleSlug from '@/components/posts/PostsSingleSlug';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('SlateStarCodex'));
}

assertRouteHasWhiteBackground("/codex/[slug]");

export default function Page() {
  return <RouteRoot delayedStatusCode metadata={{
    subtitle: 'SlateStarCodex',
    subtitleLink: '/codex',
  }}>
    <PostsSingleSlug />
  </RouteRoot>;
}
