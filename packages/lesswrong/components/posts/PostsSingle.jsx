import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';
import React from 'react';
import { parseQuery } from '../../lib/routeUtil.js';

const PostsSingle = ({match, router, location}) => {
  const { params } = match;
  const query = parseQuery(location);
  const version = query?.revision;

  return <Components.PostsPageWrapper documentId={params._id} sequenceId={null} version={version} />
};

PostsSingle.displayName = "PostsSingle";

registerComponent('PostsSingle', PostsSingle, withRouter);
