import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import PostsPageWrapper from "@/components/posts/PostsPage/PostsPageWrapper";

const SequencesPost = () => {
  const { query, params } = useLocation();
  const { postId, sequenceId } = params;
  
  const version = query.revision
  return <PostsPageWrapper documentId={postId} sequenceId={sequenceId} version={version} />
};

const SequencesPostComponent = registerComponent('SequencesPost', SequencesPost);

declare global {
  interface ComponentTypes {
    SequencesPost: typeof SequencesPostComponent
  }
}

export default SequencesPostComponent;

