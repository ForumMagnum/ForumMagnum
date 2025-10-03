"use client";

import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import PostsPageWrapper from "./PostsPage/PostsPageWrapper";
import Error404 from "../common/Error404";

interface PostsSingleRouteProps {
  _id?: string;
}

const PostsSingleRoute = ({ _id }: PostsSingleRouteProps) => {
  const { query } = useLocation();
  const version = query?.revision;
  
  if (_id) {
    return <PostsPageWrapper documentId={_id} sequenceId={null} version={version} />
  } else {
    return <Error404/>
  }
};

export default registerComponent('PostsSingleRoute', PostsSingleRoute);
