import React, { useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from "../common/withHover";
import { useSingle } from '../../lib/crud/withSingle';
import CommentIcon from '@material-ui/icons/ModeComment';

const styles = (theme: ThemeType): JssStyles => ({
  sideCommentIcon: {
    float: "right",
    width: 0,


    background: theme.palette.panelBackground.darken03,
    borderRadius: 8,
    color: theme.palette.icon.dim,
    cursor: "pointer",
  },
  popper: {
    width: 550,
  },
  sideCommentHover: {
    border: theme.palette.border.normal,
  },
});

const SideCommentIcon = ({commentIds, post, classes}: {
  commentIds: string[]
  post: PostsDetails
  classes: ClassesType
}) => {
  const {LWPopper, SideCommentHover} = Components;
  const {eventHandlers, hover, anchorEl} = useHover();
  const wrapperRef = useRef<HTMLDivElement|null>(null);
  
  return <div {...eventHandlers} ref={wrapperRef} className={classes.sideCommentIcon}>
    <CommentIcon/>
    {hover && <LWPopper
      open={hover} anchorEl={anchorEl}
      className={classes.popper}
      clickable={true}
      placement={"bottom-start"}
    >
      <SideCommentHover post={post} commentIds={commentIds}/>
    </LWPopper>}
  </div>
}

const SideCommentHover = ({commentIds, post, classes}: {
  commentIds: string[],
  post: PostsDetails
  classes: ClassesType,
}) => {
  const { SideCommentSingle } = Components;
  
  return <div className={classes.sideCommentHover}>
    {commentIds.map(commentId =>
      <SideCommentSingle
        key={commentId}
        commentId={commentId}
        post={post}
      />
    )}
  </div>
}

const SideCommentSingle = ({commentId, post}: {
  commentId: string,
  post: PostsDetails,
}) => {
  const { CommentWithReplies, Loading } = Components;
  const { document: comment, data, loading, error } = useSingle({
    documentId: commentId,
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
  });
  
  if (loading) return <Loading/>
  if (!comment) return null;
  
  return <CommentWithReplies
    comment={comment} post={post}
    commentNodeProps={{
      treeOptions: {
        showPostTitle: false,
      },
    }}
  />
}

const SideCommentIconComponent = registerComponent('SideCommentIcon', SideCommentIcon, {styles});
const SideCommentHoverComponent = registerComponent('SideCommentHover', SideCommentHover, {styles});
const SideCommentSingleComponent = registerComponent('SideCommentSingle', SideCommentSingle, {styles});

declare global {
  interface ComponentTypes {
    SideCommentIcon: typeof SideCommentIconComponent
    SideCommentHover: typeof SideCommentHoverComponent
    SideCommentSingle: typeof SideCommentSingleComponent
  }
}
