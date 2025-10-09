import React, { useEffect, useState, useRef, useCallback } from 'react';
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeComment';
import { useOnNavigate } from '../hooks/useOnNavigate';
import { useTracking, AnalyticsContext } from "../../lib/analyticsEvents";
import { hasSideComments } from '../../lib/betas';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useDialog } from '../common/withDialog';

import dynamic from 'next/dynamic';
import { TooltipSpan } from '../common/FMTooltip';
const LWTooltip = dynamic(() => import("../common/LWTooltip"), { ssr: false });
const ReplyCommentDialog = dynamic(() => import("./ReplyCommentDialog"), { ssr: false });

const selectedTextToolbarStyles = defineStyles("CommentOnSelectionContentWrapper", (theme: ThemeType) => ({
  toolbarWrapper: {
    position: "absolute",
  },
  toolbar: {
    position: "relative",
    top: -8,
    borderRadius: 8,
    color: theme.palette.icon.dim,
    zIndex: theme.zIndexes.lwPopper,
    display: "inline-block",
    width: 40, height: 40,
    padding: 8,
    cursor: "pointer",
    
    "&:hover": {
      background: theme.palette.panelBackground.darken08,
    },

    // Hide on mobile to avoid horizontal scrolling
    [theme.breakpoints.down('xs')]: {
      display: hasSideComments() ? "none" : "initial",
    },
  },
}));

type SelectedTextToolbarState =
    {open: false}
  | {open: true, x: number, y: number}

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
 * an HTML element with onClickComment monkeypatched onto it. Placement of the
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
      for (let i=0; i<selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        const container = range.commonAncestorContainer;
        const wrapper = findAncestorElementWithCommentOnSelectionWrapper(container);
        if (commonWrapper) {
          if (container !== commonWrapper) {
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
      const selectionBoundingRect = selection.getRangeAt(0).getBoundingClientRect();
      const wrapperBoundingRect = commonWrapper.getBoundingClientRect();
      
      // Place the toolbar
      const x = window.scrollX + Math.max(
        selectionBoundingRect.x + selectionBoundingRect.width,
        wrapperBoundingRect.x + wrapperBoundingRect.width);
      const y = selectionBoundingRect.y + window.scrollY;
      setToolbarState({open: true, x,y});
    };
    document.addEventListener('selectionchange', selectionChangedHandler);
    
    return () => {
      document.removeEventListener('selectionchange', selectionChangedHandler);
    };
  }, [closeToolbar]);
  
  useOnNavigate(() => {
    closeToolbar();
  });
  
  return <>
    {children}
  </>
}

export const CommentOnSelectionButton = ({onClick}: {
  onClick: () => void
}) => {
  const classes = useStyles(selectedTextToolbarStyles);
  const { captureEvent } = useTracking()

  const onClickComment = () => {
    captureEvent("commentOnSelectionClicked");
    const firstSelectedNode = document.getSelection()?.anchorNode;
    if (!firstSelectedNode) {
      return;
    }
    const contentWrapper = findAncestorElementWithCommentOnSelectionWrapper(firstSelectedNode);
    if (!contentWrapper) {
      return;
    }
    const selectionHtml = selectionToBlockquoteHTML(document.getSelection());
    // This HTML is XSS-safe because it's copied from somewhere that was already in the page as HTML, and is copied in a way that is syntax-aware throughout.
    (contentWrapper as any).onClickComment(selectionHtml);
    
    onClick();
  }

  return <TooltipSpan className={classes.toolbar} title={<p>Click to start writing a comment with a quote of the selected text</p>}>
    <AnalyticsContext pageElementContext="selectedTextToolbar">
      <CommentIcon onClick={(ev: React.MouseEvent) => {
        onClickComment();
      }}/>
    </AnalyticsContext>
  </TooltipSpan>
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
    if (wrapperDivRef.current) {
      let modifiedDiv = (wrapperDivRef.current as any)
      modifiedDiv.onClickComment = onClickComment;
      
      return () => {
        modifiedDiv.onClickComment = null;
      }
    }
  }, [onClickComment]);
  
  if (!hasSideComments()) {
    return <>{children}</>;
  }
  
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
 * corresponds to a CommentOnSelectionContentWrapper component, ie, one with an
 * onClickComment function attached.
 *
 * Client-side only.
 */
function findAncestorElementWithCommentOnSelectionWrapper(start: Node): HTMLElement|null {
  return nearestAncestorElementWith(
    start,
    n=>!!((n as any).onClickComment)
  );
}

/**
 * selectionToBlockquoteHTML: Given a selection (this is a browser API, returned
 * from document.getSelection()), return the selected content, wrapped in a
 * blockquote. The resulting HTML is XSS-safe because it was already present in
 * the document as HTML.
 *
 * Client-side only.
 */
function selectionToBlockquoteHTML(selection: Selection|null): string {
  if (!selection || !selection.rangeCount)
    return "";
  
  var container = document.createElement("div");
  for (let i=0; i<selection.rangeCount; i++) {
    container.appendChild(selection.getRangeAt(i).cloneContents());
  }
  const selectedHTML = container.innerHTML;
  return `<blockquote>${selectedHTML}</blockquote><p></p>`;
}

