import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { styles } from '../common/HeaderSubtitle';
import { Helmet } from '../../lib/utils/componentsWithChildren';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsBaseQuery = gql(`
  query PostsPageHeaderTitle($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsBase
      }
    }
  }
`);

const PostsPageHeaderTitle = ({siteName}: {
  siteName: string,
}) => {
  const { params: {_id, postId} } = useLocation();
  const { loading, data } = useQuery(PostsBaseQuery, {
    variables: { documentId: _id || postId },
  });
  const post = data?.post?.result;

  if (!post || loading) return null;
  const titleString = `${post.title} — ${siteName}`

  return <Helmet>
    <title>{titleString}</title>
    <meta property='og:title' content={titleString}/>
  </Helmet>
}

const PostsPageHeaderTitleComponent = registerComponent("PostsPageHeaderTitle", PostsPageHeaderTitle, {styles});

declare global {
  interface ComponentTypes {
    PostsPageHeaderTitle: typeof PostsPageHeaderTitleComponent
  }
}
