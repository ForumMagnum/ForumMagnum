import React from "react";
import PostsSingleSlug from '@/components/posts/PostsSingleSlug';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('HPMoR'));
}

export default function Page() {
  return <RouteRoot metadata={{ subtitle: 'HPMoR', subtitleLink: '/hpmor', background: 'white' }}>
    <PostsSingleSlug />
  </RouteRoot>;
}
