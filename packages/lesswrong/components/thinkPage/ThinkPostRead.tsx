// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { ThinkWrapper } from './ThinkWrapper';
import { useLocation } from '@/lib/routeUtil';
import { useSingle } from '@/lib/crud/withSingle';
import { CENTRAL_COLUMN_WIDTH } from '../posts/PostsPage/PostsPage';

const styles = (theme: ThemeType) => ({
  title: {
    marginBottom: theme.spacing.unit * 4
  },
  postBody: {
    maxWidth: CENTRAL_COLUMN_WIDTH
  }
});

export const ThinkPostRead = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { LWPostsPageHeader, ThinkWrapper, ContentStyles, ContentItemBody, Loading } = Components;

  const { params: {postId} } = useLocation();

  const { document: post, loading } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsPage",
  });

  return <ThinkWrapper>
    {loading && <Loading/>}
    {post && <LWPostsPageHeader post={post} dialogueResponses={[]} />} 
    {post && <div className={classes.postBody}>
      <ContentStyles contentType={"post"}>
        <ContentItemBody dangerouslySetInnerHTML={{__html: post.contents?.html ?? ""}} />
      </ContentStyles>
    </div>}
  </ThinkWrapper>
}

const ThinkPostReadComponent = registerComponent('ThinkPostRead', ThinkPostRead, {styles});

declare global {
  interface ComponentTypes {
    ThinkPostRead: typeof ThinkPostReadComponent
  }
}
