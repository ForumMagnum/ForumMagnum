"use client";
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import PostsPageWrapper from "../posts/PostsPage/PostsPageWrapper";

const SequencesPost = ({postId, sequenceId}: {postId: string, sequenceId: string}) => {
  const { query } = useLocation();
  const version = query.revision

  return <PostsPageWrapper documentId={postId} sequenceId={sequenceId} version={version} />
};

export default SequencesPost;



