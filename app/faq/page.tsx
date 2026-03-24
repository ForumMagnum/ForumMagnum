import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import { faqPostIdSetting } from "@/lib/instanceSettings";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { PostsSingle, type PostPageSearchParams } from "@/components/posts/PostsSingle";
import { getMetadataForPostPageWithFixedId } from "@/server/pageMetadata/postPageMetadata";

export const generateMetadata = getMetadataForPostPageWithFixedId(() => faqPostIdSetting.get())

assertRouteAttributes("/faq", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page({ searchParams }: {
  searchParams: Promise<PostPageSearchParams>
}) {
  return <RouteRoot>
    <PostsSingle _id={faqPostIdSetting.get()} searchParams={searchParams} />
  </RouteRoot>;
}
