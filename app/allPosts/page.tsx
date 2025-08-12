import React from "react";
import AllPostsPage from '@/components/posts/AllPostsPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";

export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), {
    title: 'All Posts',
  });
}

export default function Page() {
  // enableResourcePrefetch was: true
  
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: true }} />
    <AllPostsPage />
  </>;
}
