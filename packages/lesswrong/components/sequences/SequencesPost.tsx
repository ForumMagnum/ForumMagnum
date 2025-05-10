import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { PostsPageWrapper } from "../posts/PostsPage/PostsPageWrapper";

const SequencesPostInner = () => {
  const { query, params } = useLocation();
  const { postId, sequenceId } = params;
  
  const version = query.revision
  return <PostsPageWrapper documentId={postId} sequenceId={sequenceId} version={version} />
};

export const SequencesPost = registerComponent('SequencesPost', SequencesPostInner);



