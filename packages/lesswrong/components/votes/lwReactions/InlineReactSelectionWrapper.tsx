import Mark from 'mark.js';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getVotingSystemByName } from '../../../lib/voting/votingSystems';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useVote } from '../withVote';

export const hideSelectorClassName = "hidden-selector";
const hiddenSelector = `& .${hideSelectorClassName}`;

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    [hiddenSelector]: {
      backgroundColor: theme.palette.background.primaryTranslucentHeavy
    }
  },
  button: {
    zIndex: 1000,
    position: "relative",
    left: 12,
    backgroundColor: theme.palette.background.paper, 
  },
});

export const InlineReactSelectionWrapper = ({classes, comment, children, commentItemRef}: {
  classes: ClassesType,
  comment: CommentsList,
  children: React.ReactNode,
  commentItemRef?: React.RefObject<HTMLDivElement>|null // we need this to check if the mouse is still over the comment, and it needs to be passed down from CommentsItem instead of declared here because it needs extra padding in order to behave intuively (without losing the selection)
}) => {
  const commentTextRef = useRef<HTMLDivElement|null>(null);
  const popupRef = useRef<HTMLDivElement|null>(null);
  const [quote, setQuote] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  const [yOffset, setYOffset] = useState<number>(0);
  const [disabledButton, setDisabledButton] = useState<boolean>(false);

  const { AddInlineReactionButton, LWPopper } = Components;

  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const voteProps = useVote(comment, "Comments", votingSystem);
  

  function getYOffsetFromDocument (selection: Selection, commentTextRef: React.RefObject<HTMLDivElement>) {
    const commentTextRect = commentTextRef.current?.getBoundingClientRect();
    if (!commentTextRect) return 0;
    const documentCenter = commentTextRect?.top + (commentTextRect?.height / 2);

    const selectionRectTop = selection.getRangeAt(0).getBoundingClientRect().top;
    const selectionRectBottom = selection.getRangeAt(0).getBoundingClientRect().bottom;
    const selectionY = (selectionRectTop + selectionRectBottom) / 2;
    return selectionY - documentCenter;
  }

  const detectSelection = useCallback((e: MouseEvent): void => {
  
    function unMark() {
      const ref = commentItemRef?.current
      if (!ref) return
      let markInstance = new Mark(ref);
      markInstance.unmark({className: hideSelectorClassName});
    }

    function clearAll() {
      setAnchorEl(null);
      setQuote("")
      unMark()
      setDisabledButton(false)
    }
  
    const selection = window.getSelection()
    const selectedText = selection?.toString() ?? ""
    const selectionAnchorNode = selection?.anchorNode
    if (!selectionAnchorNode) {
      clearAll()
      return
    }

    const selectionInCommentRef = commentItemRef && commentItemRef.current?.contains(selectionAnchorNode);
    const selectionInPopupRef = popupRef && popupRef.current?.contains(selectionAnchorNode as Node);

    if (selectionInCommentRef && !selectionInPopupRef) {
      const anchorEl = commentItemRef.current;
      
      if (anchorEl instanceof HTMLElement && selectedText.length > 1 ) {  
        setAnchorEl(anchorEl);
        setQuote(selectedText);
        setYOffset(getYOffsetFromDocument(selection, commentTextRef));
        const commentText = commentItemRef.current?.textContent ?? ""
        // Count the number of occurrences of the quote in the raw text
        const count = (commentText.match(new RegExp(selectedText, "g")) || []).length;
        setDisabledButton(count > 1)
      } else {
        clearAll()
      }
    }
    if (!selectionInCommentRef && !selectionInPopupRef) {
      clearAll()
    }
  }, [commentItemRef, commentTextRef]);
  
  useEffect(() => { 
    document.addEventListener('selectionchange', detectSelection);
    return () => {
      document.removeEventListener('selectionchange', detectSelection);
    };
  }, [detectSelection, commentItemRef]);

  return (
    <div className={classes.root} ref={commentTextRef}>
      <LWPopper
        open={!!anchorEl} anchorEl={anchorEl}
        placement="right"
        allowOverflow={true}
      >
        <span ref={popupRef} className={classes.button} 
          style={{position:"relative", top: yOffset, marginLeft: 12}}
        >
          <AddInlineReactionButton quote={quote} voteProps={voteProps} disabled={disabledButton}/>
        </span> 
      </LWPopper>
      {children}
    </div>
  );
}

const InlineReactSelectionWrapperComponent = registerComponent('InlineReactSelectionWrapper', InlineReactSelectionWrapper, {styles});

declare global {
  interface ComponentTypes {
    InlineReactSelectionWrapper: typeof InlineReactSelectionWrapperComponent
  }
}

