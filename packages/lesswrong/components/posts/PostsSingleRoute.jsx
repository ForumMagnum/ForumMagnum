import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withRouter } from '../../lib/reactRouterWrapper.js';

const PostsSingleRoute = ({route, router, params, location}) => {
  const query = parseQuery(location);
  const version = query?.revision
  if (route._id) {
    return <Components.PostsPage documentId={route._id} sequenceId={null} version={version} />
  }
};

PostsSingleRoute.displayName = "PostsSingleRoute";

registerComponent('PostsSingleRoute', PostsSingleRoute, withRouter);
