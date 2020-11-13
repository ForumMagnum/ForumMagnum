import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { usePostByLegacyId } from './usePost';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';

const LegacyPostRedirect = () => {
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

const LegacyPostRedirectComponent = registerComponent('LegacyPostRedirect', LegacyPostRedirect);

declare global {
  interface ComponentTypes {
    LegacyPostRedirect: typeof LegacyPostRedirectComponent
  }
}

