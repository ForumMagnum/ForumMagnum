import React from "react";
import PostsRevisionSelect from '@/components/revisions/PostsRevisionSelect';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string; slug: string }>(({ _id }) => _id);

export default function Page() {
  return <RouteRoot>
    <PostsRevisionSelect />
  </RouteRoot>;
}
