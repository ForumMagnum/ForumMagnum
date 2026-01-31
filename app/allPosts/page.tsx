import React from "react";
import AllPostsPage from '@/components/posts/AllPostsPage';
import { getDefaultMetadata, getMetadataDescriptionFields, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { siteNameWithArticleSetting } from "@/lib/instanceSettings";
import RouteRoot from "@/components/layout/RouteRoot";

export async function generateMetadata(): Promise<Metadata> {
  return merge(
    {},
    await getDefaultMetadata(),
    getMetadataDescriptionFields(`All of ${siteNameWithArticleSetting.get()}'s posts, filtered and sorted however you want`),
    getPageTitleFields('All Posts')
  );
}

export default function Page() {
  return <RouteRoot hasLeftNavigationColumn>
    <AllPostsPage />
  </RouteRoot>;
}
