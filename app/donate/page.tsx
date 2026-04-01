import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { PostsSingle, type PostPageSearchParams } from "@/components/posts/PostsSingle";
import { getMetadataForPostPageWithFixedId } from "@/server/pageMetadata/postPageMetadata";

export const generateMetadata = getMetadataForPostPageWithFixedId(() => 'LcpQQvcpWfPXvW7R9')

assertRouteAttributes("/donate", {
  whiteBackground: true,
  hasLinkPreview: false,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

export default async function Page({ searchParams }: {
  searchParams: Promise<PostPageSearchParams>
}) {
  return <RouteRoot delayedStatusCode>
    <PostsSingle _id="LcpQQvcpWfPXvW7R9" searchParams={searchParams} />
  </RouteRoot>;
}
