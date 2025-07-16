import React from "react";
import PostsSingleSlugRedirect from '@/components/posts/PostsSingleSlugRedirect';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";

// TODO: figure out if we need to be returning metadata from this page, given that it ends up redirecting anyways
// export const generateMetadata = getPostPageMetadataFunction<{ /* TODO: fill this in based on this route's params! */ }>(({ _id }) => _id);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{
      background: 'white',
      noFooter: false,
      titleComponent: PostsPageHeaderTitle
    }} />
    <PostsSingleSlugRedirect />
  </>;
}
