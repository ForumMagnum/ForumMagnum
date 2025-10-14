import React, { useEffect, useState, useRef, useCallback } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import type { ContentItemBodyImperative } from '../../contents/contentBodyUtil';
import type { VotingProps } from '../votingProps';
import AddInlineReactionButton from "./AddInlineReactionButton";
import LWPopper from "../../common/LWPopper";

const styles = (theme: ThemeType) => ({
  popper: {
    height: 0,
  },
  button: {
    zIndex: 1000,
    position: "relative",
    left: 12,
  },
});

type Styling = "comment"|"post"|"tag"|"messageRight"|"messageLeft";

function getButtonOffsetLeft(styling: Styling, contentRef?: React.RefObject<ContentItemBodyImperative | null> | null): number {
  switch (styling) {
    case "comment":
      return 12;
    // messageLeft is for messages by the current user, and indicates the inline react button should be to the left of the message item (since the message is right-aligned)
    // messageRight is for messages by other users, and indicates the inline react button should be to the right of the message item (since the message is left-aligned)
    // The messageLeft and messageRight values were chosen empirically to avoid overlap between the button background and the message container.
    case "messageLeft":
      const anchorElWidth = (contentRef?.current?.getAnchorEl()?.getBoundingClientRect().width ?? 0) + 64;
      return anchorElWidth * -1;
    case "messageRight":
      return 0;
    case "post":
    case "tag":
      return 30;
  }
}

function getButtonOffsetTop(styling: Styling): number {
  switch (styling) {
    case "comment":
    case "messageLeft":
    case "messageRight":
      return -10;
    case "post":
    case "tag":
      return 0;
  }
}

const InlineReactSelectionWrapper = ({contentRef, voteProps, styling, setHasSelection, children, classes}: {
  contentRef?: React.RefObject<ContentItemBodyImperative|null>|null, // we need this to check if the mouse is still over the comment, and it needs to be passed down from CommentsItem instead of declared here because it needs extra padding in order to behave intuively (without losing the selection)
  voteProps: VotingProps<VoteableTypeClient>
  styling: Styling,
  setHasSelection?: (hasSelection: boolean) => void,
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const commentTextRef = useRef<HTMLDivElement|null>(null);
  const popupRef = useRef<HTMLDivElement|null>(null);
  const [quote, setQuote] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  const [yOffset, setYOffset] = useState<number>(0);
  const [disabledButton, setDisabledButton] = useState<boolean>(false);
  const detectSelection = useCallback((e: MouseEvent): void => {
    function clearAll() {
      setAnchorEl(null);
      setQuote("")
      setDisabledButton(false)
      setHasSelection?.(false)
    }
  
    const selection = window.getSelection()
    const selectedText = selection?.toString() ?? ""
    const selectionAnchorNode = selection?.anchorNode
    if (!selectionAnchorNode) {
      clearAll()
      return
    }

    const selectionInCommentRef = contentRef?.current?.containsNode(selectionAnchorNode);
    const selectionInPopupRef = popupRef && popupRef.current?.contains(selectionAnchorNode as Node);

    if (selectionInCommentRef && !selectionInPopupRef) {
      const anchorEl = contentRef?.current?.getAnchorEl();
      
      if (anchorEl instanceof HTMLElement && selectedText.length > 1 ) {
        setAnchorEl(anchorEl);
        setQuote(selectedText);
        setYOffset(getYOffsetFromDocument(selection, commentTextRef));
        const commentText = contentRef?.current?.getText() ?? "";
        // Count the number of occurrences of the quote in the raw text
        const count = countStringsInString(commentText, selectedText);
        setDisabledButton(count > 1)
        setHasSelection?.(true)
      } else {
        clearAll()
      }
    }
    if (!selectionInCommentRef && !selectionInPopupRef) {
      clearAll()
    }
  }, [contentRef, commentTextRef, setHasSelection]);
  
  useEffect(() => { 
    document.addEventListener('selectionchange', detectSelection);
    return () => {
      document.removeEventListener('selectionchange', detectSelection);
    };
  }, [detectSelection]);
  
  const buttonOffsetLeft = getButtonOffsetLeft(styling, contentRef);
  const buttonOffsetTop = getButtonOffsetTop(styling);

  return (
    <div ref={commentTextRef}>
      <LWPopper
        className={classes.popper}
        open={!!anchorEl} anchorEl={anchorEl}
        placement="right"
        allowOverflow={true}
      >
        <span ref={popupRef} className={classes.button}
          style={{position:"relative", top: yOffset+buttonOffsetTop, marginLeft: buttonOffsetLeft}}
        >
          <AddInlineReactionButton quote={quote} voteProps={voteProps} disabled={disabledButton}/>
        </span> 
      </LWPopper>

      {children}
    </div>
  );
}

function getYOffsetFromDocument (selection: Selection, commentTextRef: React.RefObject<HTMLDivElement|null>) {
  const commentTextRect = commentTextRef.current?.getBoundingClientRect();
  if (!commentTextRect) return 0;

  const documentCenter = commentTextRect?.top + (commentTextRect?.height / 2);
  const selectionRectTop = selection.getRangeAt(0).getBoundingClientRect().top;
  
  return selectionRectTop - documentCenter;
}

/** Count instances of a smaller string 'needle' in a larger string 'haystack'. */
function countStringsInString(haystack: string, needle: string): number {
  let count = 0;
  let index = 0;
  while ((index = haystack.indexOf(needle, index)) !== -1) {
    count++;
    index += needle.length;
  }
  return count;
}

export default registerComponent('InlineReactSelectionWrapper', InlineReactSelectionWrapper, {styles});


