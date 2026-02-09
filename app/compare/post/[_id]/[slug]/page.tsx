import React from "react";
import PostsCompareRevisions from '@/components/posts/PostsCompareRevisions';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

export default async function Page({ params }: {
  params: Promise<{ _id: string, slug: string }>
}) {
  const { _id, slug } = await params;
  return <RouteRoot>
    <PostsCompareRevisions postId={_id} slug={slug} />
  </RouteRoot>;
}
