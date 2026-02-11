import React from "react";
import PostsEditPage from '@/components/posts/PostsEditPage';
import { Metadata } from "next";
import { getDefaultMetadata, getPageTitleFields, getResolverContextForGenerateMetadata } from "@/server/pageMetadata/sharedMetadata";
import merge from "lodash/merge";
import { PostsEditFormQuery } from "@/components/posts/queries";
import RouteRoot from "@/components/layout/RouteRoot";
import { assertRouteHasWhiteBackground } from "@/components/layout/routeBackgroundColors";
import { runQuery } from "@/server/vulcan-lib/query";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ postId?: string, version?: string }> }): Promise<Metadata> {
  const [searchParamsValues, defaultMetadata] = await Promise.all([searchParams, getDefaultMetadata()]);
  const { postId, version } = searchParamsValues;

  if (!postId) return {};

  try {
    const resolverContext = await getResolverContextForGenerateMetadata(searchParamsValues);
    const { data } = await runQuery(
      PostsEditFormQuery,
      { documentId: postId, version: version ?? 'draft' },
      resolverContext
    );
  
    if (!data?.post?.result) return {};
  
    const post = data.post.result;
    
    return merge({}, defaultMetadata, getPageTitleFields(post.title));  
  } catch (error) {
    return defaultMetadata;
  }
}

assertRouteHasWhiteBackground("/editPost");

export default function Page() {
  return <RouteRoot delayedStatusCode >
    <PostsEditPage />
  </RouteRoot>;
}
