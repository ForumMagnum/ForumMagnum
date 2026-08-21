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

    // Hide on mobile to avoid horizontal scrolling
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

/**
 * CommentOnSelectionPageWrapper: Wrapper around the entire page (used in
 * Layout) which adds event handlers to text-selection. If the selected range is
 * entirely wrapped in a CommentOnSelectionWrapper (in practice: is a post-body
 * on a post-page), places a floating comment button in the margin to the right.
 * When clicked, takes the selected content (HTML), wraps it in <blockquote>,
 * and calls the onClickComment function that was passed to the
 * CommentOnSelectionWrapper. (That function, defined as part of PostsPage,
 * opens a floating comment editor prepopulated with the blockquote.)
 *
 * The CommentOnSelectionWrapper is found by walking up the DOM until we find
 * an HTML element registered in commentOnSelectionHandlers. Placement of the
 * toolbar button is done with coordinate-math.
 *
 * Positioning might be brittle if the element that supports selection is nested
 * with multiple scrollbars or certain complex positioning. Test each context
 * separately when adding `CommentOnSelectionContentWrapper`s.
 *
 * If there's no space in the right margin (eg on mobile), adding the button
 * might introduce horizontal scrolling.
 */
export const CommentOnSelectionPageWrapper = ({children}: {
  children: React.ReactNode
}) => {
  const [toolbarState,setToolbarState] = useState<SelectedTextToolbarState>({open: false});

  const closeToolbar = useCallback(() => {
    // When changing toolbarState, do it in a way where if this is {open: false}, we reuse the previous value to avoid triggering a rerender.
    setToolbarState((prevState) => prevState.open ? {open: false} : prevState);
  }, []);

  useEffect(() => {
    const selectionChangedHandler = () => {
      const selection = document.getSelection();
      const selectionText = selection+"";

      // Is this selection non-empty?
      if (!selection || !selectionText?.length) {
        closeToolbar();
        return;
      }

      // Determine whether this selection is fully wrapped in a single CommentOnSelectionContentWrapper
      let commonWrapper: HTMLElement|null = null;
      let hasCommonWrapper = true;
      const ranges: Range[] = [];
      for (let i=0; i<selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        ranges.push(range.cloneRange());
        const wrapper = findAncestorElementWithCommentOnSelectionWrapper(range.commonAncestorContainer);
        if (commonWrapper) {
          if (wrapper !== commonWrapper) {
            hasCommonWrapper = false;
          }
        } else {
          commonWrapper = wrapper;
        }
      }

      if (!commonWrapper || !hasCommonWrapper) {
        closeToolbar();
        return;
      }

      // Get the bounding box of the selection
      const selectionBoundingRect = ranges[0].getBoundingClientRect();
      const wrapperBoundingRect = commonWrapper.getBoundingClientRect();

      // Place the toolbar
      const x = window.scrollX + Math.max(
        selectionBoundingRect.x + selectionBoundingRect.width,
        wrapperBoundingRect.x + wrapperBoundingRect.width);
      const y = selectionBoundingRect.y + window.scrollY;
      setToolbarState({open: true, x, y, wrapper: commonWrapper, ranges});
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
    // This HTML is XSS-safe because it's copied from somewhere that was already in the page as HTML, and is copied in a way that is syntax-aware throughout.
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

/**
 * SelectedTextToolbar: The toolbar that pops up when you select content inside
 * a post. Consists of just a comment button, which opens a floating comment
 * editor. Created as a dialog by CommentOnSelectionPageWrapper.
 *
 * onClickComment: Called when the comment button is pressed. This fires on
 *   mousedown (with the default prevented) rather than on click, because
 *   pressing the mouse outside a text selection collapses the selection in
 *   some browsers, and the resulting selectionchange would unmount this
 *   toolbar before a click event could be delivered to it.
 * x, y: In the page coordinate system, ie, relative to the top-left corner when
 *   the page is scrolled to the top.
 */
const SelectedTextToolbar = ({onClickComment, x, y}: {
  onClickComment: () => void,
  x: number, y: number,
}) => {
  const classes = useStyles(selectedTextToolbarStyles);
  const { captureEvent } = useTracking()

  return <div className={classes.toolbarWrapper} style={{left: x, top: y}}>
    <LWTooltip inlineBlock={false} title={<div><p>Click to comment on the selected text</p></div>}>
      <div
        className={classes.toolbar}
        onMouseDown={(ev: React.MouseEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
          captureEvent("commentOnSelectionClicked");
          onClickComment();
        }}
      >
        <AnalyticsContext pageElementContext="selectedTextToolbar">
          <CommentIcon/>
        </AnalyticsContext>
      </div>
    </LWTooltip>
  </div>
}


/**
 * CommentOnSelectionContentWrapper: Marks the contents inside it so that when
 * you highlight text, a floating comment button appears in the right margin.
 * When that button is clicked, calls onClickComment with the selected content,
 * wrapped in <blockquote>.
 *
 * See CommentOnSelectionPageWrapper for notes on implementation details.
 */
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

/**
 * Starting from an HTML node, climb the tree until one is found which matches
 * the given function. Returns the deepest matching element, or null if no
 * match.
 *
 * Client-side only.
 */
function nearestAncestorElementWith(start: Node|null, fn: (node: HTMLElement) => boolean): HTMLElement|null {
  if (!start)
    return null;

  let pos: HTMLElement|null = start.parentElement;
  while(pos && !fn(pos)) {
    pos = pos.parentElement;
  }
  return pos;
}

/**
 * Starting from an HTML node, climb the tree until one is found which
 * corresponds to a CommentOnSelectionContentWrapper component, ie, one with a
 * registered comment handler.
 *
 * Client-side only.
 */
function findAncestorElementWithCommentOnSelectionWrapper(start: Node): HTMLElement|null {
  return nearestAncestorElementWith(
    start,
    n => commentOnSelectionHandlers.has(n)
  );
}

/**
 * rangesToBlockquoteHTML: Given the ranges of a selection (cloned from
 * document.getSelection() at the time the toolbar was shown), return the
 * selected content, wrapped in a blockquote. The resulting HTML is XSS-safe
 * because it was already present in the document as HTML.
 *
 * Client-side only.
 */
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
