import { getForumTypeForPage } from "@/server/utils/requestUtil";
import React from "react";
import AllPostsPage from '@/components/posts/AllPostsPage';
import { getDefaultMetadata, getMetadataDescriptionFields, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { siteNameWithArticleSetting } from "@/lib/instanceSettings";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

export async function generateMetadata(): Promise<Metadata> {
  const forumType = await getForumTypeForPage();
  return merge(
    {},
    await getDefaultMetadata(),
    getMetadataDescriptionFields(`All of ${siteNameWithArticleSetting.get(forumType)}'s posts, filtered and sorted however you want`),
    await getPageTitleFields('All Posts')
  );
}

assertRouteAttributes("/allPosts", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: true,
  hasMarkdownVersion: false,
});

export default function Page() {
  return <RouteRoot>
    <AllPostsPage />
  </RouteRoot>;
}
