import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';

const PostsSingleRoute = () => {
  const { currentRoute, query } = useLocation();
  const version = query?.revision
  if (currentRoute?._id) {
    return <Components.PostsPageWrapper documentId={currentRoute._id} sequenceId={null} version={version} />
  } else {
    return <Components.Error404/>
  }
};

const PostsSingleRouteComponent = registerComponent('PostsSingleRoute', PostsSingleRoute);

declare global {
  interface ComponentTypes {
    PostsSingleRoute: typeof PostsSingleRouteComponent
  }
}
