import React, { useEffect, useContext, useState, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import CommentIcon from '@material-ui/icons/ModeComment';

const selectedTextToolbarStyles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.darken03,
    borderRadius: 8,
    color: theme.palette.icon.dim,
    position: "absolute",
    zIndex: theme.zIndexes.lwPopper,
    padding: 8,
    cursor: "pointer",
    
    "&:hover": {
      background: theme.palette.panelBackground.darken08,
    },
  },
  commentIcon: {
  },
});

// CommentOnSelectionPageWrapper is used in Layout, and wraps the whole page
// CommentOnSelectionContentWrapper wraps elements in which the content is selectable

interface CommentOnSelectionContextType {
}

export const CommentOnSelectionContext = React.createContext<CommentOnSelectionContextType|null>(null);

type SelectedTextToolbarState =
    {open: false}
  | {open: true, x: number, y: number}

const CommentOnSelectionPageWrapper = ({children}: {
  children: React.ReactNode
}) => {
  const { SelectedTextToolbar } = Components;
  const [toolbarState,setToolbarState] = useState<SelectedTextToolbarState>({open: false});
 
  useEffect(() => {
    const selectionChangedHandler = (event) => {
      const selection = document.getSelection();
      const selectionText = selection+"";
      
      // Is this selection non-empty?
      if (!selection || !selectionText?.length) {
        setToolbarState({open: false});
        return;
      }
      
      // Determine whether this selection is fully wrapped in a single CommentOnSelectionWrapper
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
        setToolbarState({open: false});
        return;
      }
      
      // Get the bounding box of the selection
      const selectionBoundingRect = selection.getRangeAt(0).getBoundingClientRect();
      const wrapperBoundingRect = commonWrapper.getBoundingClientRect();
      
      // Place the toolbar
      //const x = selectionBoundingRect.x + (selectionBoundingRect.width/2) + window.scrollX;
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
  }, []);
  
  const onClickComment = (ev) => {
    const firstSelectedNode = document.getSelection()?.anchorNode;
    if (!firstSelectedNode) {
      return;
    }
    const contentWrapper = findAncestorElementWithCommentOnSelectionWrapper(firstSelectedNode);
    if (!contentWrapper) {
      return;
    }
    const selection = document.getSelection();
    const selectionText = selection+"";
    (contentWrapper as any).onClickComment(selectionText);
  }
  
  return <CommentOnSelectionContext.Provider value={{}}>
    {children}
    {toolbarState.open && <SelectedTextToolbar
      onClickComment={onClickComment}
      x={toolbarState.x} y={toolbarState.y}
    />}
  </CommentOnSelectionContext.Provider>
}

const SelectedTextToolbar = ({onClickComment, x, y, classes}: {
  onClickComment: (ev)=>void,
  x: number, y: number,
  classes: ClassesType,
}) => {
  return <div className={classes.root} style={{left: x, top: y}}>
    <CommentIcon className={classes.commentIcon} onClick={ev => onClickComment(ev)}/>
  </div>
}


const CommentOnSelectionContentWrapper = ({onClickComment, children}: {
  onClickComment: (text: string)=>void,
  children: React.ReactNode,
}) => {
  const wrapperSpanRef = useRef<HTMLSpanElement|null>(null);
  
  useEffect(() => {
    if (wrapperSpanRef.current) {
      let modifiedSpan = (wrapperSpanRef.current as any)
      modifiedSpan.onClickComment = onClickComment;
      
      return () => {
        modifiedSpan.onClickComment = null;
      }
    }
  }, [onClickComment]);
  
  return <span className="commentOnSelection" ref={wrapperSpanRef}>
    {children}
  </span>
}

function nearestAncestorElementWith(start: Node|null, fn: (node: Node)=>boolean): HTMLElement|null {
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
    n=>!!((n as any).onClickComment)
  );
}



const CommentOnSelectionPageWrapperComponent = registerComponent('CommentOnSelectionPageWrapper', CommentOnSelectionPageWrapper);
const SelectedTextToolbarComponent = registerComponent(
  'SelectedTextToolbar', SelectedTextToolbar,
  {styles: selectedTextToolbarStyles}
);
const CommentOnSelectionContentWrapperComponent = registerComponent("CommentOnSelectionContentWrapper", CommentOnSelectionContentWrapper);

declare global {
  interface ComponentTypes {
    CommentOnSelectionPageWrapper: typeof CommentOnSelectionPageWrapperComponent
    SelectedTextToolbar: typeof SelectedTextToolbarComponent
    CommentOnSelectionContentWrapper: typeof CommentOnSelectionContentWrapperComponent,
  }
}
