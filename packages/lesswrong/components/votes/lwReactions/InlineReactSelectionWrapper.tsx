import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import type { ContentItemBodyImperative } from '../../common/ContentItemBody';
import type { VotingProps } from '../votingProps';

export const hideSelectorClassName = "hidden-selector";
const hiddenSelector = `& .${hideSelectorClassName}`;

const styles = (theme: ThemeType) => ({
  root: {
    [hiddenSelector]: {
      backgroundColor: theme.palette.background.primaryTranslucentHeavy
    }
  },
  popper: {
    height: 0,
  },
  button: {
    zIndex: 1000,
    position: "relative",
    left: 12,
  },
});

export const InlineReactSelectionWrapper = ({contentRef, voteProps, styling, children, classes}: {
  contentRef?: React.RefObject<ContentItemBodyImperative|null>|null, // we need this to check if the mouse is still over the comment, and it needs to be passed down from CommentsItem instead of declared here because it needs extra padding in order to behave intuively (without losing the selection)
  voteProps: VotingProps<VoteableTypeClient>
  styling: "comment"|"post"|"tag",
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const commentTextRef = useRef<HTMLDivElement|null>(null);
  const popupRef = useRef<HTMLDivElement|null>(null);
  const [quote, setQuote] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  const [yOffset, setYOffset] = useState<number>(0);
  const [disabledButton, setDisabledButton] = useState<boolean>(false);

  const { AddInlineReactionButton, LWPopper } = Components;
  
  const detectSelection = useCallback((e: MouseEvent): void => {
    function clearAll() {
      setAnchorEl(null);
      setQuote("")
      setDisabledButton(false)
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
      } else {
        clearAll()
      }
    }
    if (!selectionInCommentRef && !selectionInPopupRef) {
      clearAll()
    }
  }, [contentRef, commentTextRef]);
  
  useEffect(() => { 
    document.addEventListener('selectionchange', detectSelection);
    return () => {
      document.removeEventListener('selectionchange', detectSelection);
    };
  }, [detectSelection]);
  
  const buttonOffsetLeft = (styling==="comment") ? 12 : 30;
  const buttonOffsetTop = (styling==="comment") ? -10 : 0;

  return (
    <div className={classes.root} ref={commentTextRef}>
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

const InlineReactSelectionWrapperComponent = registerComponent('InlineReactSelectionWrapper', InlineReactSelectionWrapper, {styles});

declare global {
  interface ComponentTypes {
    InlineReactSelectionWrapper: typeof InlineReactSelectionWrapperComponent
  }
}
