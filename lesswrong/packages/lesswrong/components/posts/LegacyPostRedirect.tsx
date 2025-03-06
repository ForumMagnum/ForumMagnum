import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { usePostByLegacyId } from './usePost';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import Error404 from "@/components/common/Error404";
import { Loading } from "@/components/vulcan-core/Loading";
import PermanentRedirect from "@/components/common/PermanentRedirect";

const LegacyPostRedirect = () => {
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

const LegacyPostRedirectComponent = registerComponent('LegacyPostRedirect', LegacyPostRedirect);

declare global {
  interface ComponentTypes {
    LegacyPostRedirect: typeof LegacyPostRedirectComponent
  }
}

export default LegacyPostRedirectComponent;

