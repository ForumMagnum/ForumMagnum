import React from "react";
import PostsSingle from '../../../../packages/lesswrong/components/posts/PostsSingle';
import type { Metadata } from "next";
import { gql } from "@/lib/generated/gql-codegen";
import { getClient } from "@/lib/apollo/nextApolloClient";
import { tabLongTitleSetting, tabTitleSetting } from "@/lib/instanceSettings";

const PostsBaseQuery = gql(`
  query PostsPageHeaderTitle($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsBase
      }
    }
  }
`);

export async function generateMetadata({ params }: { params: Promise<{ _id: string, slug: string }> }): Promise<Metadata> {
  const { _id, slug } = await params;
  const client = getClient();
  const { data } = await client.query({
    query: PostsBaseQuery,
    variables: { documentId: _id },
  });

  const post = data?.post?.result;

  if (!post) return {};
  const siteName = tabTitleSetting.get() ?? tabLongTitleSetting.get();
  const titleString = `${post.title} — ${siteName}`;

  return {
    title: titleString,
    openGraph: {
      title: titleString,
    }
  };
}

export default function PostPage() {
  return <PostsSingle />;
}