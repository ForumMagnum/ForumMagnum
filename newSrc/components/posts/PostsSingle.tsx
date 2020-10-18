import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import React from 'react';

const PostsSingle = () => {
  const { params, query } = useLocation();
  const version = query?.revision;

  return <Components.PostsPageWrapper documentId={params._id} sequenceId={null} version={version} />
};

const PostsSingleComponent = registerComponent('PostsSingle', PostsSingle);

declare global {
  interface ComponentTypes {
    PostsSingle: typeof PostsSingleComponent
  }
}

