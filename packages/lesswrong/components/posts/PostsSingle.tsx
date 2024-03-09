import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import React from 'react';

const PostsSingle = () => {
  const { params, query } = useLocation();
  const version = query?.revision;

  if (params._id.length !== 17) { 
    return <Components.PermanentRedirect status={307} url={'/posts/slug/' + params._id}/>
  }


  return <Components.PostsPageWrapper documentId={params._id} sequenceId={null} version={version} />
};

const PostsSingleComponent = registerComponent('PostsSingle', PostsSingle);

declare global {
  interface ComponentTypes {
    PostsSingle: typeof PostsSingleComponent
  }
}

