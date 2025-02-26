import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import React from 'react';
import { isLWorAF } from '../../lib/instanceSettings';

const PostsSingle = () => {
  const { params, query } = useLocation();
  const version = query?.revision;

  if (((params._id.length !== 17 && params._id.length !== 24) || params._id.includes("-")) && isLWorAF) { 
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

