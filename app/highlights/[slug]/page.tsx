import React from "react";
import PostsSingleSlug from '@/components/posts/PostsSingleSlug';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Sequence Highlights',
  });
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{
      subtitle: 'Sequence Highlights',
      subtitleLink: '/highlights',
      background: 'white'
    }} />
    <PostsSingleSlug />
  </>;
}
