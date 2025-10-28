import React from "react";
import PostsSingleSlug from '@/components/posts/PostsSingleSlug';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Sequence Highlights',
  });
}

export default function Page() {
  return <RouteRoot delayedStatusCode metadata={{
    subtitle: 'Sequence Highlights',
    subtitleLink: '/highlights',
    background: 'white'
  }}>
    <PostsSingleSlug />
  </RouteRoot>;
}
