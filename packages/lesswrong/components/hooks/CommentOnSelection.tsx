import React, { useEffect, useContext, useState, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import CommentIcon from '@material-ui/icons/ModeComment';

const selectedTextToolbarStyles = (theme: ThemeType): JssStyles => ({
  root: {
    background: "#aaa", //TODO
    border: "1px solid black", //TODO
    position: "absolute",
    zIndex: 10000, //TODO
    padding: 8,
    marginTop: -32,
    marginLeft: -32,
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
      let commonWrapper: Node|null = null;
      let hasCommonWrapper = true;
      for (let i=0; i<selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        const container = range.commonAncestorContainer;
        const wrapper = nearestAncestorElementWith(
          container,
          n=>!!((n as any).onClickComment)
        );
        if (commonWrapper) {
          if (container !== commonWrapper) {
            hasCommonWrapper = false;
          }
        } else {
          commonWrapper = wrapper;
        }
      }
      
      // Get the bounding box of the selection
      const boundingRect = selection.getRangeAt(0).getBoundingClientRect();
      
      // Place the toolbar
      const x = boundingRect.x + (boundingRect.width/2) + window.scrollX;
      const y = boundingRect.y + window.scrollY;
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
    const contentWrapper = nearestAncestorElementWith(
      firstSelectedNode,
      n=>!!((n as any).onClickComment)
    );
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

function nearestAncestorElementWith(start: Node, fn: (node: Node)=>boolean): Node|null {
  let pos: Node|null = start;
  while(pos && !fn(pos)) {
    pos = pos.parentElement;
  }
  return pos;
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
