"use client";
import React from 'react';
import { usePostBySlug } from './usePost';
import PostsPageWrapper from "./PostsPage/PostsPageWrapper";
import Loading from "../vulcan-core/Loading";
import Error404 from "../common/Error404";

const PostsSingleSlug = ({slug, sequenceId, version}: {slug: string, sequenceId: string|null, version: string|undefined}) => {
  const { post, loading } = usePostBySlug({ slug });
  
  if (post) {
    return <PostsPageWrapper documentId={post._id} sequenceId={sequenceId} version={version} redirectBehavior="noRedirect" />
  } else {
    return loading ? <Loading/> : <Error404 />
  }
};

export default PostsSingleSlug;


