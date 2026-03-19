import React from "react";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteAttributes } from "@/lib/routeChecks/assertRouteAttributes";
import { PostsSingle, type PostPageSearchParams } from "@/components/posts/PostsSingle";

// TODO: this route previously used PostsPageHeaderTitle for its metadata, but that was nonsensical because
// it was using a slug to then do a permanent redirect, and PostsPageHeaderTitle needs an _id or postId
// in the query parameters.  I assume the correct metadata should come through from the redirect, but TBD.
// export const generateMetadata = getPostPageMetadataFunction<{ /* TODO: fill this in based on this route's params! */ }>(({ _id }) => _id);

assertRouteAttributes("/posts/slug/[slug]", {
  whiteBackground: true,
  hasLinkPreview: true,
  hasPingbacks: true,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: true,
});

export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<PostPageSearchParams>
}) {
  const { slug } = await params;
  return <RouteRoot
    delayedStatusCode
  >
    <PostsSingle slug={slug} searchParams={searchParams} />
  </RouteRoot>;
}
