import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { usePostBySlug } from './usePost';
import Error404 from "@/components/common/Error404";
import { Loading } from "@/components/vulcan-core/Loading";
import PostsPageWrapper from "@/components/posts/PostsPage/PostsPageWrapper";

const PostsSingleSlug = () => {
  const { params, query } = useLocation();
  const version = query?.revision
  const slug = params.slug;
  const { post, loading } = usePostBySlug({ slug });
  
  if (post) {
    return <PostsPageWrapper documentId={post._id} sequenceId={null} version={version} />
  } else {
    return loading ? <Loading/> : <Error404 />
  }
};

const PostsSingleSlugComponent = registerComponent('PostsSingleSlug', PostsSingleSlug);

declare global {
  interface ComponentTypes {
    PostsSingleSlug: typeof PostsSingleSlugComponent
  }
}

export default PostsSingleSlugComponent;
