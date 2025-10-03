import React from "react";
import PostsWithApprovedJargonPage from '@/components/jargon/PostsWithApprovedJargonPage';
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/next/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'Posts with approved jargon',
  });
}

export default function Page() {
  return <RouteRoot>
    <PostsWithApprovedJargonPage />
  </RouteRoot>
}
