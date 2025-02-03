// TODO: Import component in components.ts
import React, { useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '@/lib/crud/withSingle';
import { useLocation } from '@/lib/routeUtil';
import { useRecordPostView } from '../hooks/useRecordPostView';

export const ThinkPostPage = () => {

  const { Error404, Loading, ThinkPost, ThinkWrapper } = Components;

  const { params: {postId, sequenceId} } = useLocation();

  const { document: post, loading } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsPage",
    skip: !postId
  });

  const { document: sequence, loading: sequenceLoading } = useSingle({
    documentId: sequenceId,
    collectionName: "Sequences",
    fragmentName: "SequencesPageWithChaptersFragment",
    skip: !sequenceId
  });

  const { recordPostView } = useRecordPostView(post as PostsListBase);

  useEffect(() => {
    if (!postId) return;
    void recordPostView({
      post: post as PostsPage,
    });
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  if (!post && !loading) return <ThinkWrapper><Error404/></ThinkWrapper>;
  if (!post && loading) return <ThinkWrapper><Loading/></ThinkWrapper>;

  return <ThinkPost post={post} sequence={sequence} />
}

const ThinkPostWrapperComponent = registerComponent('ThinkPostPage', ThinkPostPage);

declare global {
  interface ComponentTypes {
    ThinkPostPage: typeof ThinkPostWrapperComponent
  }
}
