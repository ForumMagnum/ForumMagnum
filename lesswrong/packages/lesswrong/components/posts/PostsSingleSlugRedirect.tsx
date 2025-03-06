import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { usePostBySlug } from './usePost';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import Error404 from "@/components/common/Error404";
import { Loading } from "@/components/vulcan-core/Loading";
import PermanentRedirect from "@/components/common/PermanentRedirect";

const PostsSingleSlugRedirect = () => {
  const { params } = useLocation();
  const slug = params.slug;
  const { post, loading } = usePostBySlug({ slug });

  if (post) {
    const canonicalUrl = postGetPageUrl(post);
    return <PermanentRedirect url={canonicalUrl}/>
  } else {
    return loading ? <Loading/> : <Error404 />
  }
};

const PostsSingleSlugRedirectComponent = registerComponent('PostsSingleSlugRedirect', PostsSingleSlugRedirect);

declare global {
  interface ComponentTypes {
    PostsSingleSlugRedirect: typeof PostsSingleSlugRedirectComponent
  }
}

export default PostsSingleSlugRedirectComponent;
