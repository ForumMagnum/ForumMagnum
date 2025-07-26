import React from "react";
import PostsSingleSlugRedirect from '@/components/posts/PostsSingleSlugRedirect';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { hasPostRecommendations } from "@/lib/betas";

// TODO: this route previously used PostsPageHeaderTitle for its metadata, but that was nonsensical because
// it was using a slug to then do a permanent redirect, and PostsPageHeaderTitle needs an _id or postId
// in the query parameters.  I assume the correct metadata should come through from the redirect, but TBD.
// export const generateMetadata = getPostPageMetadataFunction<{ /* TODO: fill this in based on this route's params! */ }>(({ _id }) => _id);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{
      background: 'white',
      noFooter: hasPostRecommendations,
      titleComponent: PostsPageHeaderTitle
    }} />
    <PostsSingleSlugRedirect />
  </>;
}
