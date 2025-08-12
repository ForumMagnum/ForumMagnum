import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { hasPostRecommendations } from "@/lib/betas";

// TODO: this route previously did _not_ use the PostsPageHeaderTitle for its metadata.
// Check whether we want that to continue to be true?
export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Community',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{
      subtitle: 'Community',
      subtitleLink: '/community',
      background: 'white',
      noFooter: hasPostRecommendations
    }} />
    <PostsSingle />
  </>;
}
