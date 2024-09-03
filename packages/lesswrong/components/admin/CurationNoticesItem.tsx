// TODO: Import component in components.ts
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
  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  commentBody: {
    ...commentBodyStyles(theme)
  }
});

const { ContentItemBody, Button, BasicFormStyles, WrappedSmartForm } = Components;

export const CurationNoticesItem = ({curationNotice, classes}: {
  curationNotice: CurationNoticesFragment,
  classes: ClassesType<typeof styles>
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const [ edit, setEdit ] = useState<boolean>(false)

  const { create } = useCreate({
    collectionName: "Comments",
    fragmentName: 'CommentsList'
  });

  const {mutate: UpdateCurrentCurationNotice} = useUpdate({
    collectionName: "CurationNotices",
    fragmentName: 'CurationNoticesFragment',
  });

  const makeComment = async (curationNotice: CurationNoticesFragment
  ) => {
    if (!curationNotice.contents) {throw Error("Error creating comment")}

    const comment = {
      postId: curationNotice.postId,
      userId: curationNotice.userId,
      contents: { originalContents: { 
        data: curationNotice.contents.originalContents.data,
        type: curationNotice.contents.originalContents.type,
      }} as EditableFieldContents
    };

    try {
      const result = await create({data: comment});
      const commentId = result.data?.createComment.data._id;
      UpdateCurrentCurationNotice({
        selector: { _id: curationNotice._id },
        data: { commentId: commentId }
      });
      console.log("I just did a refetch, apparently)")
    } catch (error) {
      console.error("Error creating comment: ", error)
    }

    // UpdateCurrentCurationNotice({
    //   commentId: 
    // })
  }

  if (curationNotice.post === null) return "error: no post associated with curation notice";

  return <div className={classes.root}>
    { edit ? 
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
            // successCallback={(a) => console.log(a)}
          />
      </BasicFormStyles>
    </div>
    : <>
      <div className={classes.meta}>
        <div>
          <span className={classes.postTitle}>{curationNotice.post?.title}</span>
          <span className={classes.username}>Curation by {curationNotice.user?.displayName}</span>
        </div>
      </div>
      <div
        onClick={() => setEdit(true)}
        className={classes.editButton}
        >
        Edit
      </div>
      <ContentItemBody dangerouslySetInnerHTML={{__html: curationNotice.contents?.html ?? ''}} className={classes.commentBody}/>
      <div
        onClick={() => makeComment(curationNotice)}
        className={classes.publishButton}
        >
        Publish
      </div>
      <div>{curationNotice.commentId}</div>
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
function getMarkdownContents(text: string) {
  throw new Error('Function not implemented.');
}

