// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { ThinkWrapper } from './ThinkWrapper';
import { useLocation } from '@/lib/routeUtil';
import { useSingle } from '@/lib/crud/withSingle';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ThinkPostRead = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { PostBody, PostsPageTitle, ThinkWrapper } = Components;

  const { params: {postId} } = useLocation();

  const { document: post, loading } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsWithNavigation",
  });

  if (!post || loading) return null;

  return <ThinkWrapper>
    <PostsPageTitle post={post} />
    <PostBody post={post} />
  </ThinkWrapper>
}

const ThinkPostReadComponent = registerComponent('ThinkPostRead', ThinkPostRead, {styles});

declare global {
  interface ComponentTypes {
    ThinkPostRead: typeof ThinkPostReadComponent
  }
}
