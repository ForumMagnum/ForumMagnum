import { getClient } from "@/lib/apollo/nextApolloClient";
import { gql } from "@/lib/generated/gql-codegen";
import { tabLongTitleSetting, tabTitleSetting } from "@/lib/instanceSettings";
import type { Metadata } from "next";
import merge from "lodash/merge";
import { defaultMetadata } from "./sharedMetadata";

const PostTitleQuery = gql(`
  query PostMetadataTitle($postId: String) {
    post(selector: { _id: $postId }) {
      result {
        _id
        title
      }
    }
  }
`);

export function getPostPageMetadataFunction<Params>(paramsToPostIdConverter: (params: Params) => string) {
  return async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const paramValues = await params;

    const postId = paramsToPostIdConverter(paramValues);
    const client = getClient();
    const { data } = await client.query({
      query: PostTitleQuery,
      variables: { postId },
    });

    const post = data?.post?.result;

    if (!post) return {};
    const siteName = tabTitleSetting.get() ?? tabLongTitleSetting.get();
    const titleString = `${post.title} — ${siteName}`;


    return merge(defaultMetadata, {
      title: titleString,
      openGraph: {
        title: titleString,
      }
    });
  }
}