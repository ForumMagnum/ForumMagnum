import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import type { Metadata } from "next";
import merge from "lodash/merge";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";

// TODO: this route previously did _not_ use the PostsPageHeaderTitle for its metadata.
// Check whether we want that to continue to be true?
export async function generateMetadata(): Promise<Metadata> {
  return merge({}, await getDefaultMetadata(), getPageTitleFields('Community'));
}

assertRouteAttributes("/g/[groupId]/p/[_id]", {
  whiteBackground: true,
  hasLinkPreview: true,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ params }: {
  params: Promise<{ _id: string, groupId: string }>
}) {
  const { _id, groupId } = await params;
  return <RouteRoot
    delayedStatusCode
    subtitle={{ title: 'Community', link: '/community' }}
  >
    <PostsSingle _id={_id} />
  </RouteRoot>;
}
