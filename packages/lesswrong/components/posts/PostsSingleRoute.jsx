import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const PostsSingleRoute = (props) => {
  if (props.route._id) {
    return <Components.PostsPage documentId={props.route._id } />
  }
};

PostsSingleRoute.displayName = "PostsSingleRoute";

registerComponent('PostsSingleRoute', PostsSingleRoute);
