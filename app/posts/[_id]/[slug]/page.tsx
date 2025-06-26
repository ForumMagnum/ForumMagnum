import React from "react";
import PostsSingle from '../../../../packages/lesswrong/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

export default function PostPage() {
  return <PostsSingle />;
}