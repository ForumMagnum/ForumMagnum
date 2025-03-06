import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import Error404 from "@/components/common/Error404";
import PostsPageWrapper from "@/components/posts/PostsPage/PostsPageWrapper";

const PostsSingleRoute = () => {
  const { currentRoute, query } = useLocation();
  const version = query?.revision
  if (currentRoute?._id) {
    return <PostsPageWrapper documentId={currentRoute._id} sequenceId={null} version={version} />
  } else {
    return <Error404/>
  }
};

const PostsSingleRouteComponent = registerComponent('PostsSingleRoute', PostsSingleRoute);

declare global {
  interface ComponentTypes {
    PostsSingleRoute: typeof PostsSingleRouteComponent
  }
}

export default PostsSingleRouteComponent;
