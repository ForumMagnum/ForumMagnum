import React from "react";
import RouteRoot from "@/components/next/RouteRoot";
import { PostsPageHeaderTitle } from "@/components/titles/PostsPageHeaderTitle";
import { hasPostRecommendations } from "@/lib/betas";
import Loading from "@/components/vulcan-core/Loading";

export default async function PostsLoadingPage() {
  return <RouteRoot
    delayedStatusCode
    metadata={{
      background: 'white',
      noFooter: hasPostRecommendations(),
      titleComponent: PostsPageHeaderTitle
    }}
  >
    <Loading/>
  </RouteRoot>;
}

