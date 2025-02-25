import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { usePostBySlug } from './usePost';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';

const PostsSingleSlugRedirect = () => {
  const { params } = useLocation();
  const slug = params.slug;
  const { post, loading } = usePostBySlug({ slug });

  if (post) {
    const canonicalUrl = postGetPageUrl(post);
    return <Components.PermanentRedirect url={canonicalUrl}/>
  } else {
    return loading ? <Components.Loading/> : <Components.Error404 />
  }
};

const PostsSingleSlugRedirectComponent = registerComponent('PostsSingleSlugRedirect', PostsSingleSlugRedirect);

declare global {
  interface ComponentTypes {
    PostsSingleSlugRedirect: typeof PostsSingleSlugRedirectComponent
  }
}
