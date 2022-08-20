import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil'

const PostsEditPage = () => {
  const { query } = useLocation();
  const postId = query.postId;
  const eventForm = !!(query.eventForm === "true");
  
  return <div>
    <Components.PostsEditForm documentId={postId} eventForm={eventForm}/>
  </div>
}

const PostsEditPageComponent = registerComponent('PostsEditPage', PostsEditPage);

declare global {
  interface ComponentTypes {
    PostsEditPage: typeof PostsEditPageComponent
  }
}

