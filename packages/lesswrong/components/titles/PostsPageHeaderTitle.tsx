import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from '../common/Helmet';

export const PostsPageHeaderTitle = ({siteName}: {
  siteName: string,
}) => {

  const { params: {_id, postId} } = useLocation();
  const { document: post, loading } = useSingle({
    documentId: _id || postId,
    collectionName: "Posts",
    fragmentName: "PostsMinimumInfo",
  });

  if (!post || loading) return null;
  const titleString = `${post.title} — ${siteName}`

  return <Helmet name="title">
    <title>{titleString}</title>
    <meta property='og:title' content={titleString}/>
  </Helmet>
}
