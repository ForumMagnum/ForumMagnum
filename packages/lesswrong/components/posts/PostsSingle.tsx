'use client';
import React from 'react';
import { useLocation } from '@/lib/routeUtil';
import { isLWorAF } from '../../lib/instanceSettings';
import PermanentRedirect from "../common/PermanentRedirect";
import PostsPageWrapper from "./PostsPage/PostsPageWrapper";
import { isE2E } from '@/lib/executionEnvironment';

const PostsSingle = ({_id, slug}: {
  _id: string
  slug?: string
}) => {
  const { query } = useLocation();
  const version = query?.revision;

  if (!slug) {
    // If only an ID is present, heuristically determine whether there's actually a slug
    // in the ID slot and redirect
    if (((_id.length !== 17 && _id.length !== 24) || _id.includes("-")) && isLWorAF() && !isE2E) { 
      return <PermanentRedirect status={307} url={'/posts/slug/' + _id}/>
    }
  }

  return <PostsPageWrapper documentId={_id} sequenceId={null} version={version} />
};

export default PostsSingle;
