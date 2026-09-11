"use client";

import React from 'react';
import { useLocation } from '../../lib/routeUtil'
import PostsEditForm from "./PostsEditForm";
import { AnalyticsContext } from '@/lib/analyticsEvents';

const PostsEditPage = () => {
  const { query } = useLocation();
  const postId = query.postId;
  const version = query.version;

  return <div>
    <AnalyticsContext pageContext="editPost" postId={postId}>
      <PostsEditForm documentId={postId} version={version} />
    </AnalyticsContext>
  </div>
}

export default PostsEditPage;



