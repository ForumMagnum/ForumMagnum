import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const PostsSingle = (props, context) => {
  return <Components.PostsPage documentId={props.params._id} revisionId="2" />
};

PostsSingle.displayName = "PostsSingle";

registerComponent('PostsSingle', PostsSingle);
