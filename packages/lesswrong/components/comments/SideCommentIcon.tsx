import React, { useRef, useState, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from "../common/withHover";
import { useSingle } from '../../lib/crud/withSingle';
import { useTheme } from '../themes/useTheme';
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
    width: 550,
  },
  sideCommentHover: {
    border: theme.palette.border.normal,
  },
  seeInContext: {
    color: theme.palette.link.dim,
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
  
  const [pinned, setPinned] = useState(false)
  
  const pinOpen = () => {
    setPinned(!pinned)
  }
  
  return <div className={classes.sideCommentIconWrapper}>
    <span {...eventHandlers} onClick={pinOpen} className={classes.sideCommentIcon}>
      <BadgeWrapper commentCount={commentIds.length}>
        <CommentIcon className={classNames({[classes.pinned]: pinned})} />
      </BadgeWrapper>
    </span>
    {(hover || pinned) && <ClickAwayListener onClickAway={() => {
      setPinned(false)
    }}>
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
          replaceReplyButtonsWith: (comment) => <a href={"#"+comment._id} className={classes.seeInContext}>See in context</a>
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
