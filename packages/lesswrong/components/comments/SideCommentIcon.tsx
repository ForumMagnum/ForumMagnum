import React, { useRef, useState, useEffect, useContext } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useHover } from "../common/withHover";
import { useTheme } from '../themes/useTheme';
import type { ClickAwayEvent } from '../../lib/vendor/react-click-away-listener';
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeComment';
import classNames from 'classnames';
import { Badge } from "@/components/widgets/Badge";
import some from 'lodash/some';
import { useSingleWithPreload } from '@/lib/crud/useSingleWithPreload';
import { useIsMobile } from '../hooks/useScreenWidth';
import { useDialog } from '../common/withDialog';

const styles = (theme: ThemeType) => ({
  sideCommentIconWrapper: {
    color: theme.palette.icon.dim6,
    paddingLeft: 8,
    
    "@media print": {
      display: "none",
    },
  },
  sideCommentIcon: {
    cursor: "pointer",
    paddingTop: 4,
    whiteSpace: "nowrap",
    "& svg": {
      height: 17,
    },
    '&:hover': {
      color: theme.palette.icon.dim5,
    }
  },
  clickToPinMessage: {
    position: "absolute",
    display: "inline-block",
    top: -2, left: 36,
    fontSize: 13,
    color: theme.palette.text.dim45,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  extendHoverTarget: {
    position: "absolute",
    top: 0, left: 0,
    width: 350,
    height: 30,
    display: "inline-block",
  },
  pinned: {
    color: theme.palette.icon.dim,
  },
  popper: {
    width: 350,
    zIndex: theme.zIndexes.sideCommentBox,
  },
  sideCommentHover: {
  },
  seeInContext: {
    color: theme.palette.link.dim,
    paddingBottom:8,
    paddingTop: 4,
  },
  badge: {
    fontSize: 12,
    color: theme.palette.text.dim45,
  },
  desktopIcon: {
    display: "none",
    [theme.breakpoints.up('sm')]: {
      display: "block",
    },
  },
  lineColor: {
    background: theme.palette.sideItemIndicator.sideComment,
  },
});

const dialogStyles = () => ({
  dialogPaper: {
    marginTop: 48,
    marginBottom: 48,
    marginLeft: 18,
    marginRight: 18,
  },
});

const BadgeWrapper = ({commentCount, classes, children}: {
  commentCount: number,
  classes: ClassesType<typeof styles>,
  children: React.ReactNode
}) => {
  if (commentCount>1) {
    return <Badge
      badgeClassName={classes.badge}
      badgeContent={commentCount}
    >{children}</Badge>
  } else {
    return <>{children}</>
  }
}

const SideCommentIcon = ({commentIds, post, classes}: {
  commentIds: string[]
  post: PostsList
  classes: ClassesType<typeof styles>
}) => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <SideCommentIconMobile commentIds={commentIds} post={post} classes={classes} />;
  } else {
    return <SideCommentIconDesktop commentIds={commentIds} post={post} classes={classes} />;
  }
}

const SideCommentDialog = ({ commentIds, post, onClose, classes }: {
  commentIds: string[]
  post: PostsList,
  onClose: () => void,
  classes: ClassesType<typeof dialogStyles>
}) => {
  const { SideCommentHover, LWDialog } = Components;

  return <LWDialog open onClose={onClose} dialogClasses={{ paper: classes.dialogPaper }}>
    <SideCommentHover commentIds={commentIds} post={post} closeDialog={onClose} />
  </LWDialog>;
}

const SideCommentIconMobile = ({commentIds, post, classes}: {
  commentIds: string[]
  post: PostsList
  classes: ClassesType<typeof styles>
}) => {
  const {SideItem, SideItemLine} = Components;

  const { openDialog } = useDialog();

  const openModal = () => {
    openDialog({
      name: 'SideCommentDialog',
      contents: ({onClose}) => <Components.SideCommentDialog
        onClose={onClose}
        commentIds={commentIds}
        post={post}
      />
    });
  };
    
  return <SideItem options={{
    format: "icon"
  }}>
    <div className={classes.sideCommentIconWrapper} onClick={openModal}>
      <span className={classes.sideCommentIcon}>
        <SideItemLine colorClass={classes.lineColor}/>
      </span>
    </div>
  </SideItem>
}

const SideCommentIconDesktop = ({commentIds, post, classes}: {
  commentIds: string[]
  post: PostsList
  classes: ClassesType<typeof styles>
}) => {
  const {LWPopper, LWClickAwayListener, SideCommentHover, SideItem} = Components;
  const {eventHandlers, hover, anchorEl} = useHover();
  
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
      //setSideCommentsActive(true);
    }
  }
  const onMouseLeave = () => {
    if (pinned==="closed")
      setPinned("auto");
  }
  const onClickAway = (ev: ClickAwayEvent) => {
    const isClickOnIcon = some(
      ev.composedPath(),
      (element: Element) => element.classList?.contains(classes.sideCommentIcon)
    );
    if (!isClickOnIcon) {
      setPinned("auto");
    }
  }
  
  const isOpen = (pinned==="open" || (pinned==="auto" && hover));
  
  return <SideItem options={{
    format: "icon"
  }}>
    <div className={classes.sideCommentIconWrapper} onMouseLeave={onMouseLeave}>
      <span {...eventHandlers}
        onClick={onClick}
        className={classes.sideCommentIcon}
      >
        <span className={classes.desktopIcon}>
          <BadgeWrapper commentCount={commentIds.length} classes={classes}>
            <CommentIcon className={classNames({[classes.pinned]: (pinned==="open")})} />
          </BadgeWrapper>
          {isOpen && <span className={classes.clickToPinMessage}>
            Click to {pinned==="open" ? "close" : "pin"}
          </span>}
          {isOpen && <span className={classes.extendHoverTarget}/>}
        </span>
      </span>
      <LWPopper
        open={isOpen} anchorEl={anchorEl}
        className={classes.popper}
        clickable={true}
        allowOverflow={true}
        placement={"bottom-start"}
      >
        <LWClickAwayListener onClickAway={onClickAway}>
          <SideCommentHover post={post} commentIds={commentIds}/>
        </LWClickAwayListener>
      </LWPopper>
    </div>
  </SideItem>
}

const SideCommentHover = ({commentIds, post, closeDialog, classes}: {
  commentIds: string[],
  post: PostsList,
  closeDialog?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { SideCommentSingle } = Components;
  
  // If there's only one comment (not counting replies to that comment), don't
  // truncate it with a read more.
  const dontTruncateRoot = (commentIds.length === 1); 
  
  return <div className={classes.sideCommentHover}>
    {commentIds.map(commentId =>
      <SideCommentSingle
        key={commentId}
        commentId={commentId}
        post={post}
        dontTruncateRoot={dontTruncateRoot}
        closeDialog={closeDialog}
      />
    )}
  </div>
}

const SideCommentSingle = ({commentId, post, dontTruncateRoot=false, closeDialog, classes}: {
  commentId: string,
  post: PostsList,
  dontTruncateRoot?: boolean,
  closeDialog?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const theme = useTheme();
  const hoverColor = theme.palette.blockquoteHighlight.commentHovered;
  
  const { CommentWithReplies } = Components;
  
  const { bestResult: comment, fetchedResult: { document: loadedComment } } = useSingleWithPreload({
    collectionName: 'Comments',
    fragmentName: 'CommentWithRepliesFragment',
    preloadFragmentName: 'CommentsList',
    documentId: commentId,
  });

  const optimisticComment: CommentWithRepliesFragment | null = comment
    ? {
      ...comment,
      post: post,
      tag: null,
      latestChildren: loadedComment?.latestChildren ?? [],
    }
    : null;

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
  
  if (!optimisticComment) return null;
  
  return <div ref={rootDivRef}>
    {hoverColor && <style>
      {`.blockquote_${commentId}_1 {
          background: ${hoverColor};
          ${theme.palette.blockquoteHighlight.addedBlockquoteHighlightStyles}
      }`}
    </style>}
    <CommentWithReplies
      comment={optimisticComment} post={post}
      commentNodeProps={{
        treeOptions: {
          showPostTitle: false,
          showCollapseButtons: false,
          replaceReplyButtonsWith: (comment) =>
            <a href={"#"+comment._id} className={classes.seeInContext} onClick={closeDialog}>See in context</a>,
          hideActionsMenu: true,
          isSideComment: true,

        },
        ...(dontTruncateRoot ? {forceUnTruncated: true} : {}),
      }}
    />
  </div>
}

const SideCommentIconComponent = registerComponent('SideCommentIcon', SideCommentIcon, {styles});
const SideCommentDialogComponent = registerComponent('SideCommentDialog', SideCommentDialog, { styles: dialogStyles });
const SideCommentHoverComponent = registerComponent('SideCommentHover', SideCommentHover, {styles});
const SideCommentSingleComponent = registerComponent('SideCommentSingle', SideCommentSingle, {styles});

declare global {
  interface ComponentTypes {
    SideCommentIcon: typeof SideCommentIconComponent
    SideCommentDialog: typeof SideCommentDialogComponent
    SideCommentHover: typeof SideCommentHoverComponent
    SideCommentSingle: typeof SideCommentSingleComponent
  }
}
