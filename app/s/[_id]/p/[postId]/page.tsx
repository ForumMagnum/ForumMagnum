import React from "react";
import SequencesPost from '@/components/sequences/SequencesPost';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/next/RouteRoot";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string; postId: string }>(({ postId }) => postId);

export default function Page() {
  return <RouteRoot metadata={{ background: 'white', titleComponent: PostsPageHeaderTitle }}>
    <SequencesPost />
  </RouteRoot>;
}
