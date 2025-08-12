import React from "react";
import PostsSingleSlug from '@/components/posts/PostsSingleSlug';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'HPMoR',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ subtitle: 'HPMoR', subtitleLink: '/hpmor', background: 'white' }} />
    <PostsSingleSlug />
  </>;
}
