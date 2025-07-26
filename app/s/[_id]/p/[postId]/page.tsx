import React from "react";
import SequencesPost from '@/components/sequences/SequencesPost';
import { PostsPageHeaderTitle } from '@/components/titles/PostsPageHeaderTitle';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string; postId: string }>(({ postId }) => postId);

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white', titleComponent: PostsPageHeaderTitle }} />
    <SequencesPost />
  </>;
}
