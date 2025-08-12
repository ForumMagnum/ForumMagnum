import React from "react";
import PostsEditPage from '@/components/posts/PostsEditPage';
import { RouteMetadataSetter } from "@/components/RouteMetadataContext";
import { Metadata } from "next";
import { getDefaultMetadata, getPageTitleFields } from "@/server/pageMetadata/sharedMetadata";
import merge from "lodash/merge";
import { getClient } from "@/lib/apollo/nextApolloClient";
import { PostsEditFormQuery } from "@/components/posts/queries";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ postId?: string, version?: string }> }): Promise<Metadata> {
  const [{ postId, version }, defaultMetadata] = await Promise.all([searchParams, getDefaultMetadata()]);

  if (!postId) return {};

  try {
    const { data } = await getClient().query({
      query: PostsEditFormQuery,
      variables: { documentId: postId, version: version ?? 'draft' },
      fetchPolicy: 'network-only',
    });
  
    if (!data?.post?.result) return {};
  
    const post = data.post.result;
    
    return merge({}, defaultMetadata, getPageTitleFields(post.title));  
  } catch (error) {
    return defaultMetadata;
  }
}

export default function Page() {
  return <>
    <RouteMetadataSetter metadata={{ background: 'white' }} />
    <PostsEditPage />
  </>;
}
