import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import React from 'react';
import { isLWorAF } from '../../lib/instanceSettings';
import { PermanentRedirect } from "../common/PermanentRedirect";
import { PostsPageWrapper } from "./PostsPage/PostsPageWrapper";

const PostsSingleInner = () => {
  const { params, query } = useLocation();
  const version = query?.revision;

  if (((params._id.length !== 17 && params._id.length !== 24) || params._id.includes("-")) && isLWorAF) { 
    return <PermanentRedirect status={307} url={'/posts/slug/' + params._id}/>
  }


  return <PostsPageWrapper documentId={params._id} sequenceId={null} version={version} />
};

export const PostsSingle = registerComponent('PostsSingle', PostsSingleInner);



