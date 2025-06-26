import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import PostsPageWrapper from "./PostsPage/PostsPageWrapper";
import Error404 from "../common/Error404";

const PostsSingleRoute = () => {
  const { currentRoute, query } = useLocation();
  const version = query?.revision
  if (currentRoute?._id) {
    return <PostsPageWrapper documentId={currentRoute._id} sequenceId={null} version={version} />
  } else {
    return <Error404/>
  }
};

export default registerComponent('PostsSingleRoute', PostsSingleRoute);


