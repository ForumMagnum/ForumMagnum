import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil'
import { PostsEditForm } from "./PostsEditForm";

const PostsEditPageInner = () => {
  const { query } = useLocation();
  const postId = query.postId;
  const version = query.version;
  
  return <div>
    <PostsEditForm documentId={postId} version={version} />
  </div>
}

export const PostsEditPage = registerComponent('PostsEditPage', PostsEditPageInner);



