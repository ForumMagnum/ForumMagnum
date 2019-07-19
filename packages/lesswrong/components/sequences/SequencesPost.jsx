import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withRouter } from 'react-router';
import { parseQuery } from '../../lib/routeUtil.js';

const SequencesPost = ({params, router, location}) => {
  const query = parseQuery(location);
  const version = query?.revision
  return <Components.PostsPageWrapper documentId={params.postId} sequenceId={params.sequenceId} version={version} />
};

registerComponent('SequencesPost', SequencesPost, withRouter);
