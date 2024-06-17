import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil'

const PostsEditPage = () => {
  const { query } = useLocation();
  const postId = query.postId;
  const version = query.version;
  
  return <div>
    <Components.PostsEditForm documentId={postId} version={version} />
  </div>
}

const PostsEditPageComponent = registerComponent('PostsEditPage', PostsEditPage);

declare global {
  interface ComponentTypes {
    PostsEditPage: typeof PostsEditPageComponent
  }
}

