import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from '../common/Helmet';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const PostsBaseQuery = gql(`
  query PostsPageHeaderTitle($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsBase
      }
    }
  }
`);

export const PostsPageHeaderTitle = ({siteName}: {
  siteName: string,
}) => {

  const { params: {_id, postId} } = useLocation();
  const { loading, data } = useQuery(PostsBaseQuery, {
    variables: { documentId: _id || postId },
  });
  const post = data?.post?.result;

  if (!post || loading) return null;
  const titleString = `${post.title} — ${siteName}`

  return <Helmet name="title">
    <title>{titleString}</title>
    <meta property='og:title' content={titleString}/>
  </Helmet>
}
