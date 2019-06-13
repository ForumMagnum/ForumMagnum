import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withRouter } from '../../lib/reactRouterWrapper.js';

const SequencesPost = ({params, router}) => {
  const version = router.location && router.location.query && router.location.query.revision
  return <Components.PostsPage documentId={params.postId} sequenceId={params.sequenceId} version={version} />
};

registerComponent('SequencesPost', SequencesPost, withRouter);
