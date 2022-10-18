import React, { useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from "../common/withHover";
import { useSingle } from '../../lib/crud/withSingle';
import CommentIcon from '@material-ui/icons/ModeComment';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import classNames from 'classnames';
import Badge from '@material-ui/core/Badge';

const styles = (theme: ThemeType): JssStyles => ({
  sideCommentIconWrapper: {
    float: "right",
    position: 'relative',
    width: 0,
    background: theme.palette.panelBackground.darken03,
    borderRadius: 8,
    color: theme.palette.icon.dim6,
  },
  sideCommentIcon: {
    position: 'absolute',
    cursor: "pointer",
    marginLeft: 25,
    "& svg": {
      height: 17,
    },
    '&:hover': {
      color: theme.palette.icon.dim5,
    }
  },
  pinned: {
    color: theme.palette.icon.dim,
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
  
  const [pinned, setPinned] = useState(false)
  
  const pinOpen = () => {
    setPinned(!pinned)
  }
  
  const commentCount = commentIds.length;
  const BadgeWrapper = (commentCount>1)
    ? ({children}) => <Badge badgeContent={commentCount}>{children}</Badge>
    : ({children}) => <>{children}</>
  
  return <div ref={wrapperRef} className={classes.sideCommentIconWrapper}>
    <span {...eventHandlers} onClick={pinOpen} className={classes.sideCommentIcon}>
      <BadgeWrapper>
        <CommentIcon className={classNames({[classes.pinned]: pinned})} />
      </BadgeWrapper>
    </span>
    {(hover || pinned) && <ClickAwayListener onClickAway={() => setPinned(false)}>
      <LWPopper
        open={hover || pinned} anchorEl={anchorEl}
        className={classes.popper}
        clickable={true}
        placement={"bottom-start"}
      >
        <SideCommentHover post={post} commentIds={commentIds}/>
      </LWPopper>
    </ClickAwayListener>}
  </div>
}

const SideCommentHover = ({commentIds, post, classes}: {
  commentIds: string[],
  post: PostsDetails
  classes: ClassesType,
}) => {
  const { SideCommentSingle } = Components;
  
  // FIXME: z-index issues with comment menus
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
        showCollapseButtons: true,
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
