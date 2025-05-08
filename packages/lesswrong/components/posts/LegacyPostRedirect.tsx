import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { usePostByLegacyId } from './usePost';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';

const LegacyPostRedirectInner = () => {
  const { params } = useLocation();
  const legacyId = params.id;
  const { post, loading } = usePostByLegacyId({ legacyId });
  
  if (post) {
    const canonicalUrl = postGetPageUrl(post);
    return <Components.PermanentRedirect url={canonicalUrl}/>
  } else {
    return loading ? <Components.Loading/> : <Components.Error404 />
  }
};

export const LegacyPostRedirect = registerComponent('LegacyPostRedirect', LegacyPostRedirectInner);

declare global {
  interface ComponentTypes {
    LegacyPostRedirect: typeof LegacyPostRedirect
  }
}

