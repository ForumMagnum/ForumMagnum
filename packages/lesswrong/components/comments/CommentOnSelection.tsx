import React, { useEffect, useState, useRef, useCallback } from 'react';
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeComment';
import { useOnNavigate } from '../hooks/useOnNavigate';
import { useTracking, AnalyticsContext } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useDialog } from '../common/withDialog';

import dynamic from 'next/dynamic';
const LWTooltip = dynamic(() => import("../common/LWTooltip"), { ssr: false });
const ReplyCommentDialog = dynamic(() => import("./ReplyCommentDialog"), { ssr: false });

const selectedTextToolbarStyles = defineStyles("CommentOnSelectionContentWrapper", (theme: ThemeType) => ({
  toolbarWrapper: {
    position: "absolute",
    zIndex: theme.zIndexes.lwPopper,
  },
  toolbar: {
    display: "flex",
    borderRadius: 8,
    color: theme.palette.icon.dim,
    padding: 8,
    paddingBottom: 6,
    cursor: "pointer",
    userSelect: "none",

    "&:hover": {
      background: theme.palette.panelBackground.darken08,
    },

    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
}));

type CommentOnSelectionHandler = (html: string) => void;

const commentOnSelectionHandlers = new WeakMap<HTMLElement, CommentOnSelectionHandler>();

type SelectedTextToolbarState =
    {open: false}
  | {open: true, x: number, y: number, wrapper: HTMLElement, ranges: Range[]}

interface PagePosition {
  x: number
  y: number
}

export const CommentOnSelectionPageWrapper = ({children}: {
  children: React.ReactNode
}) => {
  const [toolbarState,setToolbarState] = useState<SelectedTextToolbarState>({open: false});

  const closeToolbar = useCallback(() => {
    setToolbarState((prevState) => prevState.open ? {open: false} : prevState);
  }, []);

  useEffect(() => {
    const selectionChangedHandler = () => {
      const selection = document.getSelection();
      if (!selection || !selection.toString().length) {
        closeToolbar();
        return;
      }

      const ranges = cloneSelectionRanges(selection);
      const wrapper = findCommonCommentOnSelectionWrapper(ranges);
      if (!wrapper) {
        closeToolbar();
        return;
      }

      const {x, y} = getToolbarPagePosition(ranges[0], wrapper);
      setToolbarState({open: true, x, y, wrapper, ranges});
    };
    document.addEventListener('selectionchange', selectionChangedHandler);

    return () => {
      document.removeEventListener('selectionchange', selectionChangedHandler);
    };
  }, [closeToolbar]);

  useOnNavigate(() => {
    closeToolbar();
  });

  const onClickComment = () => {
    if (!toolbarState.open) {
      return;
    }
    const handler = commentOnSelectionHandlers.get(toolbarState.wrapper);
    if (!handler) {
      return;
    }
    handler(rangesToBlockquoteHTML(toolbarState.ranges));
    closeToolbar();
  }

  return <>
    {children}
    {toolbarState.open && <SelectedTextToolbar
      onClickComment={onClickComment}
      x={toolbarState.x} y={toolbarState.y}
    />}
  </>
}

const SelectedTextToolbar = ({onClickComment, x, y}: {
  onClickComment: () => void,
  x: number, y: number,
}) => {
  const classes = useStyles(selectedTextToolbarStyles);
  const { captureEvent } = useTracking()

  const openCommentEditorBeforeSelectionCanCollapse = (ev: React.MouseEvent) => {
    if (ev.button !== 0) {
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    captureEvent("commentOnSelectionClicked");
    onClickComment();
  };

  return <div className={classes.toolbarWrapper} style={{left: x, top: y}}>
    <LWTooltip inlineBlock={false} title={<div><p>Click to comment on the selected text</p></div>}>
      <div className={classes.toolbar} onMouseDown={openCommentEditorBeforeSelectionCanCollapse}>
        <AnalyticsContext pageElementContext="selectedTextToolbar">
          <CommentIcon/>
        </AnalyticsContext>
      </div>
    </LWTooltip>
  </div>
}

export const CommentOnSelectionContentWrapper = ({post, children}: {
  post: PostsListWithVotes
  children: React.ReactNode,
}) => {
  const { openDialog } = useDialog();
  const wrapperDivRef = useRef<HTMLDivElement|null>(null);

  const onClickComment = useCallback((html: string) => {
    openDialog({
      name: "ReplyCommentDialog",
      contents: ({onClose}) => {
        return <ReplyCommentDialog
          onClose={onClose}
          post={post}
          initialHtml={html}
        />
      }
    })
  }, [openDialog, post]);

  useEffect(() => {
    const wrapperDiv = wrapperDivRef.current;
    if (wrapperDiv) {
      commentOnSelectionHandlers.set(wrapperDiv, onClickComment);

      return () => {
        commentOnSelectionHandlers.delete(wrapperDiv);
      }
    }
  }, [onClickComment]);

  return <div className="commentOnSelection" ref={wrapperDivRef}>
    {children}
  </div>
}

function nearestAncestorElementWith(start: Node|null, fn: (node: HTMLElement) => boolean): HTMLElement|null {
  if (!start)
    return null;

  let pos: HTMLElement|null = start.parentElement;
  while(pos && !fn(pos)) {
    pos = pos.parentElement;
  }
  return pos;
}

function findAncestorElementWithCommentOnSelectionWrapper(start: Node): HTMLElement|null {
  return nearestAncestorElementWith(
    start,
    n => commentOnSelectionHandlers.has(n)
  );
}

function cloneSelectionRanges(selection: Selection): Range[] {
  const ranges: Range[] = [];
  for (let i=0; i<selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i).cloneRange());
  }
  return ranges;
}

function findCommonCommentOnSelectionWrapper(ranges: Range[]): HTMLElement|null {
  if (!ranges.length) {
    return null;
  }
  const commonWrapper = findAncestorElementWithCommentOnSelectionWrapper(ranges[0].commonAncestorContainer);
  if (!commonWrapper) {
    return null;
  }
  for (let i=1; i<ranges.length; i++) {
    if (findAncestorElementWithCommentOnSelectionWrapper(ranges[i].commonAncestorContainer) !== commonWrapper) {
      return null;
    }
  }
  return commonWrapper;
}

function getToolbarPagePosition(selectionRange: Range, wrapper: HTMLElement): PagePosition {
  const selectionBoundingRect = selectionRange.getBoundingClientRect();
  const wrapperBoundingRect = wrapper.getBoundingClientRect();
  const x = window.scrollX + Math.max(
    selectionBoundingRect.x + selectionBoundingRect.width,
    wrapperBoundingRect.x + wrapperBoundingRect.width);
  const y = selectionBoundingRect.y + window.scrollY;
  return {x, y};
}

function rangesToBlockquoteHTML(ranges: Range[]): string {
  if (!ranges.length)
    return "";

  const container = document.createElement("div");
  for (const range of ranges) {
    container.appendChild(range.cloneContents());
  }
  const selectedHTML = container.innerHTML;
  return `<blockquote>${selectedHTML}</blockquote><p></p>`;
}
