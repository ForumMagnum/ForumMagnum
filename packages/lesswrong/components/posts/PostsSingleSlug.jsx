import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { useLocation } from '../../lib/routeUtil.js';
import { usePostBySlug } from './usePost.js';

const PostsSingleSlug = () => {
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

registerComponent('PostsSingleSlug', PostsSingleSlug);
