import { getForumTypeForPage } from "@/server/utils/pageUtil";
import React from "react";
import AllPostsPage from '@/components/posts/AllPostsPage';
import ErrorBadRequest from '@/components/common/ErrorBadRequest';
import { getAllPostsQueryParamsError } from '@/components/posts/allPostsQueryParams';
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

export default async function Page({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const queryParamsError = getAllPostsQueryParamsError(await searchParams);
  if (queryParamsError) {
    return <RouteRoot delayedStatusCode>
      <ErrorBadRequest message={queryParamsError} />
    </RouteRoot>;
  }
  return <RouteRoot>
    <AllPostsPage />
  </RouteRoot>;
}
