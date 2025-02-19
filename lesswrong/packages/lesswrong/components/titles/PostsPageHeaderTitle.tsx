import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useLocation } from '../../lib/routeUtil';
import { styles } from '../common/HeaderSubtitle';
import { Helmet } from '../../lib/utils/componentsWithChildren';

const PostsPageHeaderTitle = ({siteName}: {
  siteName: string,
}) => {
  const { params: {_id, postId} } = useLocation();
  const { document: post, loading } = useSingle({
    documentId: _id || postId,
    collectionName: "Posts",
    fragmentName: "PostsBase",
  });

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
