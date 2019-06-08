import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter } from '../../lib/reactRouterWrapper.js';
import React from 'react';

const PostsSingle = ({params, router}, context) => {
  const version = router.location && router.location.query && router.location.query.revision
  return <Components.PostsPage documentId={params._id} sequenceId={null} version={version} />
};

PostsSingle.displayName = "PostsSingle";

registerComponent('PostsSingle', PostsSingle, withRouter);
