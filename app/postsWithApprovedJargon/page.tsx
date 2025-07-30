import React from "react";
import PostsWithApprovedJargonPage from '@/components/jargon/PostsWithApprovedJargonPage';
import { defaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export function generateMetadata(): Metadata {
  return merge({}, defaultMetadata, {
    title: 'Posts with approved jargon',
  });
}

export default function Page() {
  return <PostsWithApprovedJargonPage />;
}
