import React from "react";
import PostsRevisionSelect from '@/components/revisions/PostsRevisionSelect';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";

export const generateMetadata = getPostPageMetadataFunction<{ /* TODO: fill this in based on this route's params! */ }>(({ _id }) => _id);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ titleComponent: PostsPageHeaderTitle }} />
    <PostsRevisionSelect />
  </>;
}
