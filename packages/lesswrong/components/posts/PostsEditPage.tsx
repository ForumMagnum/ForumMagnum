import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil'

const PostsEditPageInner = () => {
  const { query } = useLocation();
  const postId = query.postId;
  const version = query.version;
  
  return <div>
    <Components.PostsEditForm documentId={postId} version={version} />
  </div>
}

export const PostsEditPage = registerComponent('PostsEditPage', PostsEditPageInner);

declare global {
  interface ComponentTypes {
    PostsEditPage: typeof PostsEditPage
  }
}

