import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id, { noIndex: true });

export default async function Page({ params }: {
  params: Promise<{ _id: string, slug: string }>
}) {
  const { _id, slug } = await params;
  return <RouteRoot
    delayedStatusCode
    noFooter={false}
  >
    <PostsSingle _id={_id} slug={slug} />
  </RouteRoot>;
}
