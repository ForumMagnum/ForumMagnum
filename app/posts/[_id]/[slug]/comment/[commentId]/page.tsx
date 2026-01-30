import React from "react";
import PostsSingle from '@/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import RouteRoot from "@/components/layout/RouteRoot";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id, { noIndex: true });

export default function Page() {
  return <RouteRoot
    delayedStatusCode
    metadata={{ noFooter: false }}
  >
    <PostsSingle />
  </RouteRoot>;
}
