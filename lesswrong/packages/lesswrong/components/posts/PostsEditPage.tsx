import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil'
import PostsEditForm from "@/components/posts/PostsEditForm";

const PostsEditPage = () => {
  const { query } = useLocation();
  const postId = query.postId;
  const version = query.version;
  
  return <div>
    <PostsEditForm documentId={postId} version={version} />
  </div>
}

const PostsEditPageComponent = registerComponent('PostsEditPage', PostsEditPage);

declare global {
  interface ComponentTypes {
    PostsEditPage: typeof PostsEditPageComponent
  }
}

export default PostsEditPageComponent;

