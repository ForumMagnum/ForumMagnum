import React, { useRef, useState, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from "../common/withHover";
import { useSingle } from '../../lib/crud/withSingle';
import { useTheme } from '../themes/useTheme';
import CommentIcon from '@material-ui/icons/ModeComment';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import classNames from 'classnames';
import Badge from '@material-ui/core/Badge';
import some from 'lodash/some';

const styles = (theme: ThemeType): JssStyles => ({
  sideCommentIconWrapper: {
    float: "right",
    position: 'relative',
    width: 0,
    background: theme.palette.panelBackground.darken03,
    borderRadius: 8,
    color: theme.palette.icon.dim6,
    
    "@media print": {
      display: "none",
    },
  },
  sideCommentIcon: {
    position: 'absolute',
    cursor: "pointer",
    top: 4,
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
    width: 350,
  },
  sideCommentHover: {
  },
  seeInContext: {
    color: theme.palette.link.dim,
    paddingBottom:8,
    paddingTop: 4,
  },
});

const BadgeWrapper = ({commentCount, children}: {
  commentCount: number,
  children: React.ReactNode
}) => {
  if (commentCount>1) {
    return <Badge badgeContent={commentCount}>{children}</Badge>
  } else {
    return <>{children}</>
  }
}

const SideCommentIcon = ({commentIds, post, classes}: {
  commentIds: string[]
  post: PostsDetails
  classes: ClassesType
}) => {
  const {LWPopper, SideCommentHover} = Components;
  const {eventHandlers, hover, anchorEl} = useHover();
  const iconRef = useRef<HTMLSpanElement|null>(null);
  
  // Three-state pinning: open, closed, or auto ("auto" means visible
  // if the mouse is over the icon.) This is so that if you click on the
  // icon again when it's pinned open, it closes, and stays closed until
  // you move the mouse away and re-hover the same elmeent.
  const [pinned, setPinned] = useState<"open"|"closed"|"auto">("auto")
  
  const onClick = () => {
    if (pinned==="open") {
      setPinned("closed");
    } else {
      setPinned("open");
    }
  }
  const onMouseLeave = () => {
    if (pinned==="closed")
      setPinned("auto");
  }
  const onClickAway = (ev) => {
    const isClickOnIcon = some(ev.path, e=>e===iconRef.current);
    if (!isClickOnIcon)
      setPinned("auto")
  }
  
  const isOpen = (pinned==="open" || (pinned==="auto" && hover));
  
  return <div className={classes.sideCommentIconWrapper}
    onMouseLeave={onMouseLeave}
  >
    <span {...eventHandlers}
      onClick={onClick}
      ref={iconRef}
      className={classes.sideCommentIcon}
    >
      <BadgeWrapper commentCount={commentIds.length}>
        <CommentIcon className={classNames({[classes.pinned]: (pinned==="open")})} />
      </BadgeWrapper>
    </span>
    {isOpen && <ClickAwayListener onClickAway={onClickAway}>
      <LWPopper
        open={isOpen} anchorEl={anchorEl}
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

const SideCommentSingle = ({commentId, post, classes}: {
  commentId: string,
  post: PostsDetails,
  classes: ClassesType,
}) => {
  const theme = useTheme();
  const hoverColor = theme.palette.blockquoteHighlight.commentHovered;
  
  const { CommentWithReplies, Loading } = Components;
  const { document: comment, data, loading, error } = useSingle({
    documentId: commentId,
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
  });
  const [hoveredBlockquoteId,setHoveredBlockquoteId] = useState<string|null>(null);
  const rootDivRef = useRef<HTMLDivElement|null>(null);
  
  useEffect(() => {
    const rootDiv = rootDivRef.current;
    if (!rootDiv) return;
    
    const listener = (ev: MouseEvent) => {
      let newBlockquoteId: string|null = null;
      const hoveredElementPath = ev.composedPath();
      
      for (let pos of hoveredElementPath) {
        if ((pos as HTMLElement).tagName === 'BLOCKQUOTE') {
          // TODO: this isn't distinguishing between the comment and its children, and isn't distinguishing between blockquotes within that comment
          newBlockquoteId = `blockquote_${commentId}_1`;
          break;
        }
      }
      
      if (newBlockquoteId !== hoveredBlockquoteId) {
        setHoveredBlockquoteId(newBlockquoteId);
      }
    };
    
    rootDiv.addEventListener('mousemove', listener);
    return () => {
      rootDiv!.removeEventListener('mousemove', listener);
    }
  // Ignoring exhaustive-deps warning because it incorrectly thinks that
  // `rootDivRef.current` shouldn't be a dependency (but taking it out
  // as a dependency does in fact break the functionality.)
  //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentId, hoveredBlockquoteId, rootDivRef.current]);
  
  if (loading) return <Loading/>
  if (!comment) return null;
  
  return <div ref={rootDivRef}>
    {hoverColor && <style>
      {`.blockquote_${commentId}_1 {
          background: ${hoverColor};
          ${theme.palette.blockquoteHighlight.addedBlockquoteHighlightStyles}
      }`}
    </style>}
    <CommentWithReplies
      comment={comment} post={post}
      commentNodeProps={{
        treeOptions: {
          showPostTitle: false,
          showCollapseButtons: true,
          replaceReplyButtonsWith: (comment) =>
            <a href={"#"+comment._id} className={classes.seeInContext}>See in context</a>,
          hideActionsMenu: true,
        },
      }}
    />
  </div>
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
