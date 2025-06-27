import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";

// TODO: This route has both a titleComponent and static metadata ({ noIndex: true })!  You will need to manually merge the two.

export const generateMetadata = getPostPageMetadataFunction<{ /* TODO: fill this in based on this route's params! */ }>(({ _id }) => _id);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ noFooter: false, titleComponent: PostsPageHeaderTitle }} />
    <PostsSingle />
  </>;
}
