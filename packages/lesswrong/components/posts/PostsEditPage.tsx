import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withLocation } from '../../lib/routeUtil'

const PostsEditPage = ({ location }) => {
  const { query } = location;
  const postId = query.postId;
  const eventForm = !!(query.eventForm === "true");
  
  return <div>
    <Components.PostsEditForm documentId={postId} eventForm={eventForm}/>
  </div>
}

const PostsEditPageComponent = registerComponent('PostsEditPage', PostsEditPage, withLocation);

declare global {
  interface ComponentTypes {
    PostsEditPage: typeof PostsEditPageComponent
  }
}

