import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { hasPostRecommendations } from "@/lib/betas";
import RouteRoot from "@/components/next/RouteRoot";

// TODO: this route previously did _not_ use the PostsPageHeaderTitle for its metadata.
// Check whether we want that to continue to be true?
export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Community'));
}

export default function Page() {
  return <RouteRoot metadata={{
    subtitle: 'Community',
    subtitleLink: '/community',
    background: 'white',
    noFooter: hasPostRecommendations()
  }}>
    <PostsSingle />
  </RouteRoot>;
}
