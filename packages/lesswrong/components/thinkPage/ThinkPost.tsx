// TODO: Import component in components.ts
import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { postFormSectionStyles, ThinkWrapper } from './ThinkWrapper';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useSingle } from '@/lib/crud/withSingle';
import { CENTRAL_COLUMN_WIDTH } from '../posts/PostsPage/PostsPage';
import classNames from 'classnames';
import { getThinkPostBaseUrl, getThinkUrl } from './ThinkSideItem';
import { Link } from '@/lib/reactRouterWrapper';

const styles = (theme: ThemeType) => ({
  title: {
    marginBottom: theme.spacing.unit * 4
  },
  postBody: {
    maxWidth: CENTRAL_COLUMN_WIDTH,
    ...postFormSectionStyles(theme),
  },
  topRight: {
    position: 'absolute',
    top: 70,
    right: 8,
  },
  hide: {
    display: 'none'
  },
  editButton: {
    ...theme.typography.body2,
    color: theme.palette.grey[500],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[700],
    }
  }
});

export const ThinkPost = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { LWPostsPageHeader, ThinkWrapper, ContentStyles, ContentItemBody, Loading, LWPostsPageHeaderTopRight, PostsEditForm, SingleColumnSection, Error404 } = Components;

  const { params: {postId}, query: {edit, key} } = useLocation();
  const [isEditing, setIsEditing] = useState(edit === 'true');

  const { document: post, loading } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsPage",
  });

  const navigate = useNavigate();

  if (!post && !loading) return <ThinkWrapper><Error404/></ThinkWrapper>;
  if (!post && loading) return <ThinkWrapper><Loading/></ThinkWrapper>;

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  }

  return <ThinkWrapper>
    {loading && <Loading/>}
    {post && <LWPostsPageHeader post={post} dialogueResponses={[]} />} 
    {post && <div className={classes.topRight}>
      <LWPostsPageHeaderTopRight post={post}>
        <div className={classes.editButton} onClick={handleEditClick}>
          {isEditing ? 'Read' : 'Edit'}
        </div>
      </LWPostsPageHeaderTopRight>
    </div>}
    {post && <div className={classNames(!isEditing && classes.hide)}>
      <PostsEditForm documentId={postId} showTableOfContents={false} fields={['contents']}/>
    </div>}
    {post && <div className={classNames(isEditing && classes.hide, classes.postBody)}>
      <ContentStyles contentType={"post"}>
        <ContentItemBody dangerouslySetInnerHTML={{__html: post.contents?.html ?? ""}} />
      </ContentStyles>
    </div>}
  </ThinkWrapper>
}

const ThinkPostComponent = registerComponent('ThinkPost', ThinkPost, {styles});

declare global {
  interface ComponentTypes {
    ThinkPost: typeof ThinkPostComponent
  }
}
