import React from "react";
import PostsSingleSlug from '@/components/posts/PostsSingleSlug';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.postPage;

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('SlateStarCodex'));
}

export default function Page() {
  return <RouteRoot delayedStatusCode metadata={{
    subtitle: 'SlateStarCodex',
    subtitleLink: '/codex',
    background: 'white'
  }}>
    <PostsSingleSlug />
  </RouteRoot>;
}
