import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { usePostBySlug } from './usePost';

const PostsSingleSlugInner = () => {
  const { params, query } = useLocation();
  const version = query?.revision
  const slug = params.slug;
  const { post, loading } = usePostBySlug({ slug });
  
  if (post) {
    return <Components.PostsPageWrapper documentId={post._id} sequenceId={null} version={version} />
  } else {
    return loading ? <Components.Loading/> : <Components.Error404 />
  }
};

export const PostsSingleSlug = registerComponent('PostsSingleSlug', PostsSingleSlugInner);

declare global {
  interface ComponentTypes {
    PostsSingleSlug: typeof PostsSingleSlug
  }
}
