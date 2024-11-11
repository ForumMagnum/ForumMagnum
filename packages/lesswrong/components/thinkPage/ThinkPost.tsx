// TODO: Import component in components.ts
import React, { useEffect, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { postFormSectionStyles, ThinkWrapper } from './ThinkWrapper';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useSingle } from '@/lib/crud/withSingle';
import { CENTRAL_COLUMN_WIDTH } from '../posts/PostsPage/PostsPage';
import classNames from 'classnames';
import { usePostReadProgress } from '../posts/usePostReadProgress';
import { useRecordPostView } from '../hooks/useRecordPostView';
import { useDynamicTableOfContents } from '../hooks/useDynamicTableOfContents';

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
  },
  formContainer: {
    maxWidth: 715,
    width: '100%',
    ...postFormSectionStyles(theme),
    marginLeft: "auto",
    marginRight: "auto",
  }
});

export const ThinkPost = ({classes, post, sequence}: {
  classes: ClassesType<typeof styles>,
  post: PostsPage,
  sequence?: SequencesPageWithChaptersFragment,
}) => {
  const { LWPostsPageHeader, ThinkWrapper, ContentStyles, ContentItemBody, Loading, LWPostsPageHeaderTopRight, PostsEditForm, SingleColumnSection, Error404 } = Components;

  const { params: {postId}, query: {edit, key} } = useLocation();
  const [isEditing, setIsEditing] = useState(edit === 'true');

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  }

  const sectionData = useDynamicTableOfContents({
    html: (post as PostsPage)?.contents?.html ?? post?.contents?.htmlHighlight ?? "",
    post,
    answers: [],
  });
  const htmlWithAnchors = sectionData?.html || post?.contents?.html || "";
  
  return <ThinkWrapper document={post} sectionData={sectionData}>
    {post && <LWPostsPageHeader post={post} dialogueResponses={[]} topRightExtras={<div className={classes.editButton} onClick={handleEditClick}>
      {isEditing ? 'Read' : 'Edit'}
    </div>} />} 
    {post && <div className={classNames(!isEditing && classes.hide)}>
      <PostsEditForm documentId={postId} showTableOfContents={false} fields={['contents']}/>
    </div>}
    {post && <div className={classNames(isEditing && classes.hide, classes.postBody)}>
      <ContentStyles contentType={"post"}>
        <ContentItemBody dangerouslySetInnerHTML={{__html: htmlWithAnchors}} />
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
