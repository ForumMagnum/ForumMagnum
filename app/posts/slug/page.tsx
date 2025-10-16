import React from "react";
import PostsSingleSlugRedirect from '@/components/posts/PostsSingleSlugRedirect';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import RouteRoot from "@/components/next/RouteRoot";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.redirector;

// TODO: figure out if we need to be returning metadata from this page, given that it ends up redirecting anyways
// export const generateMetadata = getPostPageMetadataFunction<{ /* TODO: fill this in based on this route's params! */ }>(({ _id }) => _id);

export default function Page() {
  return <RouteRoot
    delayedStatusCode
    metadata={{
      background: 'white',
      noFooter: false,
      titleComponent: PostsPageHeaderTitle
    }}
  >
    <PostsSingleSlugRedirect />
  </RouteRoot>;
}
