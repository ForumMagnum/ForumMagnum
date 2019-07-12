import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withRouter } from 'react-router';
import { parseQuery } from '../../lib/routeUtil.js';

const PostsSingleRoute = ({match, router, location, currentRoute}) => {
  const query = parseQuery(location);
  const version = query?.revision
  if (currentRoute._id) {
    return <Components.PostsPage documentId={currentRoute._id} sequenceId={null} version={version} />
  }
};

PostsSingleRoute.displayName = "PostsSingleRoute";

registerComponent('PostsSingleRoute', PostsSingleRoute, withRouter);
