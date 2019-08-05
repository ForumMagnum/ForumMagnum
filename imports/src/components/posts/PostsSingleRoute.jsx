import { Components, registerComponent } from 'vulcan:core';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const PostsSingleRoute = () => {
  const { currentRoute, query } = useLocation();
  const version = query?.revision
  if (currentRoute._id) {
    return <Components.PostsPageWrapper documentId={currentRoute._id} sequenceId={null} version={version} />
  }
};

PostsSingleRoute.displayName = "PostsSingleRoute";

registerComponent('PostsSingleRoute', PostsSingleRoute);
