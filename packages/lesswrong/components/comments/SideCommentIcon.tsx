import React, { useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from "../common/withHover";
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
    maxWidth: 550,
  },
  sideCommentHover: {
  },
});

const SideCommentIcon = ({commentIds, post, classes}: {
  commentIds: string[]
  post: PostsDetails
  classes: ClassesType
}) => {
  const {LWPopper, SideCommentHover} = Components;
  const {eventHandlers, hover, anchorEl} = useHover();
  const wrapperRef = useRef<HTMLSpanElement|null>(null);
  
  return <div {...eventHandlers} ref={wrapperRef} className={classes.sideCommentIcon}>
    <CommentIcon/>
    {hover && <LWPopper
      open={hover} anchorEl={anchorEl}
      className={classes.popper}
      clickable={true}
      placement="bottom-start"
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
  const { CommentPermalink } = Components;
  
  return <div className={classes.sideCommentHover}>
    {commentIds.map(commentId =>
      <CommentPermalink
        key={commentId}
        documentId={commentId}
        post={post}
      />
    )}
  </div>
}

const SideCommentIconComponent = registerComponent('SideCommentIcon', SideCommentIcon, {styles});
const SideCommentHoverComponent = registerComponent('SideCommentHover', SideCommentHover, {styles});

declare global {
  interface ComponentTypes {
    SideCommentIcon: typeof SideCommentIconComponent
    SideCommentHover: typeof SideCommentHoverComponent
  }
}
