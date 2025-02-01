// TODO: Import component in components.ts
import React, { useEffect } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '@/lib/crud/withSingle';
import { useLocation } from '@/lib/routeUtil';
import { useRecordPostView } from '../hooks/useRecordPostView';


/*

THINK is an alternate layout for post reading/editing, in which:
 - On the left column, you have a condensed Table of Contents, followed by a chronological list of all posts you've recently read
 - The central column has both the post editor, and the rendered post body (with only one-at-a-time displayed visibly. This allows a) rapid switching between editing and reading, and b) while editing, you can see side-comments)
 - It's intended to 

*/
export const ThinkPostPage = () => {

  const { Error404, Loading, ThinkPost, ThinkWrapper } = Components;

  const { params: {postId: postIdFromParams, sequenceId}, query: {postId: postIdFromQuery} } = useLocation();

  const postId = postIdFromParams || postIdFromQuery;

  const { document: post, loading, refetch: refetchPost } = useSingle({
    documentId: postId,
collectionName: "Posts",
    fragmentName: "PostsPage",
    skip: !postId
  });

  const { document: sequence, loading: sequenceLoading, refetch: refetchSequence } = useSingle({
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

  return <ThinkPost post={post} sequence={sequence} refetchPost={refetchPost} refetchSequence={refetchSequence} />
}

const ThinkPostWrapperComponent = registerComponent('ThinkPostPage', ThinkPostPage);

declare global {
  interface ComponentTypes {
    ThinkPostPage: typeof ThinkPostWrapperComponent
  }
}
