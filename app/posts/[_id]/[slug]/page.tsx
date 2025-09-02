import React from "react";
import PostsSingle from '../../../../packages/lesswrong/components/posts/PostsSingle';
import { getPostPageMetadataFunction } from "@/server/pageMetadata/postPageMetadata";
import { PostsPageHeaderTitle } from "@/components/titles/PostsPageHeaderTitle";
import { hasPostRecommendations } from "@/lib/betas";
import RouteRoot from "@/components/next/RouteRoot";
import { notFound } from "next/navigation";
import { setRequestStatus } from "@/components/next/RequestStatus";

export const generateMetadata = getPostPageMetadataFunction<{ _id: string }>(({ _id }) => _id);

export default function PostPage() {
  console.log("PostPage 404");
  setRequestStatus(404);
  notFound();

  /*return <RouteRoot metadata={{
    background: 'white',
    noFooter: hasPostRecommendations(),
    titleComponent: PostsPageHeaderTitle
  }}>
    <PostsSingle />
  </RouteRoot>;*/
}
