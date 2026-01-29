"use client";

import React from 'react';
import { useLocation } from '../../lib/routeUtil'
import PostsEditForm from "./PostsEditForm";

const PostsEditPage = () => {
  const { query } = useLocation();
  const postId = query.postId;
  const version = query.version;
  
  return <div>
    <PostsEditForm documentId={postId} version={version} />
  </div>
}

export default PostsEditPage;



