import React from "react";
import AllPostsPage from '@/components/posts/AllPostsPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getDefaultMetadata, getMetadataDescriptionFields, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { siteNameWithArticleSetting } from "@/lib/instanceSettings";

export async function generateMetadata(): Promise<Metadata> {
  return merge(
    {},
    await getDefaultMetadata(),
    getMetadataDescriptionFields(`All of ${siteNameWithArticleSetting.get()}'s posts, filtered and sorted however you want`),
    getPageTitleFields('All Posts')
  );
}

export default function Page() {
  // enableResourcePrefetch was: true
  
  return <>
    <RouteMetadataSetter metadata={{ hasLeftNavigationColumn: true }} />
    <AllPostsPage />
  </>;
}
