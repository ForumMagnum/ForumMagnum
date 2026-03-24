import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import { aboutPostIdSetting } from "@/lib/instanceSettings";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { PostsSingle, type PostPageSearchParams } from "@/components/posts/PostsSingle";
import { getMetadataForPostPageWithFixedId, } from "@/server/pageMetadata/postPageMetadata";

export const generateMetadata = getMetadataForPostPageWithFixedId(() => aboutPostIdSetting.get())

assertRouteAttributes("/about", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<PostPageSearchParams>
}) {
  const { slug } = await params;
  return <RouteRoot>
    <PostsSingle _id={aboutPostIdSetting.get()} searchParams={searchParams} />
  </RouteRoot>;
}
