import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getVotingSystemByName } from '../../lib/voting/votingSystems';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useNamesAttachedReactionsVoting } from '../votes/NamesAttachedReactionsVoteOnComment';
import { useVote } from '../votes/withVote';

const styles = (theme: ThemeType): JssStyles => ({
  button: {
    zIndex: 1000,
    position: "relative",
    left: 12,
    backgroundColor: theme.palette.background.paper, 
  }
});

export const InlineReactSelectionWrapper = ({classes, comment, children}: {
  classes: ClassesType,
  comment: CommentsList,
  children: React.ReactNode,
}) => {
  const documentRef = useRef<HTMLDivElement|null>(null);
  const popupRef = useRef<HTMLDivElement|null>(null);
  const [quote, setQuote] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  const [yOffset, setYOffset] = useState<number>(0);

  const { AddInlineReactionButton, LWPopper } = Components;

  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const voteProps = useVote(comment, "Comments", votingSystem);
  

  function getYOffsetFromDocument (e: MouseEvent, documentRef: React.RefObject<HTMLDivElement>) {
    const documentRect = documentRef.current?.getBoundingClientRect();
    if (!documentRect) return 0;
    const documentCenter = documentRect?.top + documentRect?.height / 2;
    const mousePosition = e.clientY;
    return mousePosition - documentCenter;
  }


  // note: I originally just made this a function. ChatGPT claimed that it would
  // result in a memory leak because it would create a new function every time
  // the component re-renders. I don't know if that's true, but I'm using
  // useCallback to memoize it just in case.
  // ChatGPT also... generated this note, so watch out for that
  const detectSelection = useCallback((e: MouseEvent): void => {
    const mouseTargetInSelectionRef = documentRef && documentRef.current?.contains(e.target as Node);
    const mouseTargetInPopupRef = popupRef && popupRef.current?.contains(e.target as Node);
    const selection = window.getSelection()
    const selectedText = selection?.toString() ?? ""

    if (mouseTargetInSelectionRef && !mouseTargetInPopupRef) {
      const range = selection?.getRangeAt(0);
      const anchorEl = documentRef.current;
      
      if (anchorEl instanceof HTMLElement && selectedText?.length > 10 ) {  
        setAnchorEl(anchorEl);
        setQuote(selectedText);
        setYOffset(getYOffsetFromDocument(e, documentRef));
      } else {
        setAnchorEl(null);
        setQuote("")
      }
    }
    if (!mouseTargetInSelectionRef && !mouseTargetInPopupRef) {
      setAnchorEl(null);
      setQuote("")
    }
  }, []);
  useEffect(() => { 
    document.addEventListener('mouseup', detectSelection);
    return () => {
      document.removeEventListener('mouseup', detectSelection);
    };
  }, [detectSelection]);

  return (
    <div ref={documentRef}>
      <LWPopper
        open={!!anchorEl} anchorEl={anchorEl}
        placement="right"
        allowOverflow={true}
      >
        <span ref={popupRef} className={classes.button} 
          style={{position:"relative", top: yOffset, marginLeft: 12}}
        >
          <AddInlineReactionButton quote={quote} voteProps={voteProps}/>
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

