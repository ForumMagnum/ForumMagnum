import React from "react";
import PostsSingleSlugRedirect from '@/components/posts/PostsSingleSlugRedirect';
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";

// TODO: figure out if we need to be returning metadata from this page, given that it ends up redirecting anyways
// export const generateMetadata = getPostPageMetadataFunction<{ /* TODO: fill this in based on this route's params! */ }>(({ _id }) => _id);

assertRouteHasWhiteBackground("/posts/slug");

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <RouteRoot
    delayedStatusCode
    metadata={{
      noFooter: false,
    }}
  >
    <PostsSingleSlugRedirect slug={slug} />
  </RouteRoot>;
}
