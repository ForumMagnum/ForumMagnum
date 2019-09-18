import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useLocation } from '../../lib/routeUtil.js';
import { usePostByLegacyId } from './usePost.js';
import { Posts } from '../../lib/collections/posts/collection.js';

const LegacyPostRedirect = () => {
  const { params } = useLocation();
  const legacyId = params.id;
  const { post, loading } = usePostByLegacyId({ legacyId });
  
  if (post) {
    const canonicalUrl = Posts.getPageUrl(post);
    return <Components.PermanentRedirect url={canonicalUrl}/>
  } else {
    return loading ? <Components.Loading/> : <Components.Error404 />
  }
};

registerComponent('LegacyPostRedirect', LegacyPostRedirect);
