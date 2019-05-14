import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter } from '../../lib/reactRouterWrapper.js';
import React from 'react';

const PostsSingle = ({match, router}, context) => {
  const { params } = match;
  const version = router.location && router.location.query && router.location.query.revision
  return <Components.PostsPage documentId={params._id} version={version} />
};

PostsSingle.displayName = "PostsSingle";

registerComponent('PostsSingle', PostsSingle, withRouter);
