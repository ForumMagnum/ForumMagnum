import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withRouter } from 'react-router';
import { parseQuery } from '../../lib/routeUtil.js';

const SequencesPost = ({params, router, location, match: {params: { postId, sequenceId }}}) => {
  const query = parseQuery(location);
  const version = query.revision
  return <Components.PostsPageWrapper documentId={postId} sequenceId={sequenceId} version={version} />
};

registerComponent('SequencesPost', SequencesPost, withRouter);
