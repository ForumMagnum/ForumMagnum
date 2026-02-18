import React from "react";
import PostsRevisionSelect from '@/components/revisions/PostsRevisionSelect';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string; slug: string }>(({ _id }) => _id);

export default async function Page({ params }: {
  params: Promise<{ _id: string; slug: string }>
}) {
  const { _id, slug } = await params;
  return <RouteRoot>
    <PostsRevisionSelect postId={_id} />
  </RouteRoot>;
}
