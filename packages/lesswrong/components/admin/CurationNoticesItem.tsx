import React, { useState } from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { isFriendlyUI } from '@/themes/forumTheme';
import { commentBodyStyles } from '../../themes/stylePiping'
import { useCurrentUser } from '../common/withUser';
import { useCreate } from '@/lib/crud/withCreate';
import { commentDefaultToAlignment } from '@/lib/collections/comments/helpers';
import { User } from '@sentry/node';
import { useUpdate } from '@/lib/crud/withUpdate';
import { useOptimisticToggle } from '../hooks/useOptimisticToggle';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    border: theme.palette.border.commentBorder,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : undefined,
    cursor: "default",
    marginBottom: 20,
    background: theme.palette.background.pageActiveAreaBackground,
    padding: 12,
    position: "relative",
    paddingBottom: 24,
  },
  editButton: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
    padding: "0px 16px",
    fontSize: "16px",
    position: "absolute",
    right: 10,
    top: 10,
    textTransform: "uppercase",
    "&:hover": {
      opacity: 0.5,
    },
},
  publishButton: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
    padding: "0px 16px",
    fontSize: "16px",
    position: "absolute",
    right: 10,
    bottom: 10,
    textTransform: "uppercase",
    "&:hover": {
      opacity: 0.5,
    },
  },
  meta: {
    "& > div": {
      marginRight: 5,
    },
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    rowGap: "6px",
    marginBottom: 8,
    color: theme.palette.text.dim,
    paddingTop: "0.6em",
    marginRight: isFriendlyUI ? 40 : 20,
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: isFriendlyUI ? undefined : `${theme.palette.linkHover.dim} !important`,
    },
  },
  postTitle: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.link.dim2,
  },
  username: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontWeight: 600,
    marginLeft: 25,
  },
  commentBody: {
    ...commentBodyStyles(theme)
  },
  publishButtonDisabled: {
    color: theme.palette.grey[500],
    cursor: "not-allowed",
  }
});

export const CurationNoticesItem = ({curationNotice, classes}: {
  curationNotice: CurationNoticesFragment,
  classes: ClassesType<typeof styles>
}) => {
  const { ContentItemBody, Button, BasicFormStyles, WrappedSmartForm } = Components;


  const [edit, setEdit] = useState<boolean>(false)
  const [clickedPushing, setClickedPushing] = useState<boolean>(false)
  const { create } = useCreate({
    collectionName: "Comments",
    fragmentName: 'CommentsList'
  });

  const { mutate: updateCurrentCurationNotice } = useUpdate({
    collectionName: "CurationNotices",
    fragmentName: 'CurationNoticesFragment',
  });

  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });

  const publishCommentAndCurate = async (curationNotice: CurationNoticesFragment) => {
    const { contents, postId, userId } = curationNotice;
    if (clickedPushing) return;
    setClickedPushing(true)

    if (!contents) throw Error("Curation notice is missing contents")

    const { originalContents: { data, type } } = contents;

    const comment = {
      postId,
      userId,
      contents: {
        originalContents: { data, type }
      } as EditableFieldContents
    };

    try {
      const result = await create({ data: comment });
      const commentId = result.data?.createComment.data._id;
      await updateCurrentCurationNotice({
        selector: { _id: curationNotice._id },
        data: { commentId: commentId }
      });
      await updatePost({
        selector: { _id: curationNotice.postId },
        data: {
          reviewForCuratedUserId: curationNotice.userId,
          curatedDate: new Date(),
        }
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating comment: ", error)
    }
  }

  if (curationNotice.post === null) return null;

  return <div className={classes.root}>
    {edit ? 
      <div>
        <BasicFormStyles>
          {curationNotice.post.title}
          <WrappedSmartForm
            collectionName="CurationNotices"
            documentId={curationNotice._id}
            mutationFragment={getFragment('CurationNoticesFragment')}
            queryFragment={getFragment('CurationNoticesFragment')}
            successCallback={() => setEdit(false)}
            prefilledProps={{userId: curationNotice.userId, postId: curationNotice.postId}}
          />
        </BasicFormStyles>
      </div>
      : <>
        <div className={classes.meta}>
          <div>
            <Link to={postGetPageUrl(curationNotice.post)} className={classes.postTitle}>{curationNotice.post?.title}</Link>
            <span className={classes.username}>Curation by {curationNotice.user?.displayName}</span>
          </div>
        </div>
        {!curationNotice.commentId && <div
          onClick={() => setEdit(true)}
          className={classes.editButton}
        >
          Edit
        </div>}
        <ContentItemBody dangerouslySetInnerHTML={{__html: curationNotice.contents?.html ?? ''}} className={classes.commentBody}/>
        {!curationNotice.commentId && <div
          onClick={() => publishCommentAndCurate(curationNotice)}
          className={classNames(classes.publishButton, {
            [classes.publishButtonDisabled]: clickedPushing,
          })}
        >
          Publish & Curate
        </div>}
      </>
    }
    
  </div>
}

const CurationNoticesItemComponent = registerComponent('CurationNoticesItem', CurationNoticesItem, {styles});

declare global {
  interface ComponentTypes {
    CurationNoticesItem: typeof CurationNoticesItemComponent
  }
}


