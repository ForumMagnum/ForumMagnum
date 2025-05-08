import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { usePostByLegacyId } from './usePost';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { PermanentRedirect } from "../common/PermanentRedirect";
import { Loading } from "../vulcan-core/Loading";
import { Error404 } from "../common/Error404";

const LegacyPostRedirectInner = () => {
  const { params } = useLocation();
  const legacyId = params.id;
  const { post, loading } = usePostByLegacyId({ legacyId });
  
  if (post) {
    const canonicalUrl = postGetPageUrl(post);
    return <PermanentRedirect url={canonicalUrl}/>
  } else {
    return loading ? <Loading/> : <Error404 />
  }
};

export const LegacyPostRedirect = registerComponent('LegacyPostRedirect', LegacyPostRedirectInner);

declare global {
  interface ComponentTypes {
    LegacyPostRedirect: typeof LegacyPostRedirect
  }
}

