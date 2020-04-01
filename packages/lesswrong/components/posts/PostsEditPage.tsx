import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withLocation } from '../../lib/routeUtil'

const PostsEditPage = ({ location }) => {
  const { query } = location;
  const postId = query.postId;
  const eventForm = !!(query.eventForm === "true");
  
  return <div>
    <Components.PostsEditForm documentId={postId} eventForm={eventForm}/>
  </div>
}

const PostsEditPageComponent = registerComponent('PostsEditPage', PostsEditPage, {
  hocs: [withLocation]
});

declare global {
  interface ComponentTypes {
    PostsEditPage: typeof PostsEditPageComponent
  }
}

