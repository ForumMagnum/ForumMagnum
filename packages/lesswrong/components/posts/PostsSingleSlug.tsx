import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { usePostBySlug } from './usePost';
import { PostsPageWrapper } from "./PostsPage/PostsPageWrapper";
import { Loading } from "../vulcan-core/Loading";
import { Error404 } from "../common/Error404";

const PostsSingleSlugInner = () => {
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

export const PostsSingleSlug = registerComponent('PostsSingleSlug', PostsSingleSlugInner);


