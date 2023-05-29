import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getVotingSystemByName } from '../../lib/voting/votingSystems';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useNamesAttachedReactionsVoting } from '../votes/NamesAttachedReactionsVoteOnComment';
import { useVote } from '../votes/withVote';

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
  commentItemRef?: React.RefObject<HTMLDivElement>|null
}) => {
  const popupRef = useRef<HTMLDivElement|null>(null);
  const [quote, setQuote] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  const [yOffset, setYOffset] = useState<number>(0);

  const { AddInlineReactionButton, LWPopper } = Components;

  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const voteProps = useVote(comment, "Comments", votingSystem);
  

  function getYOffsetFromDocument (e: MouseEvent, commentItemRef: React.RefObject<HTMLDivElement>) {
    const commentItemRect = commentItemRef.current?.getBoundingClientRect();
    if (!commentItemRect) return 0;
    const documentCenter = commentItemRect?.top + (commentItemRect?.height / 2);
    const mousePosition = e.clientY;
    return mousePosition - documentCenter;
  }

  const detectSelection = useCallback((e: MouseEvent): void => {
    const mouseTargetInSelectionRef = commentItemRef && commentItemRef.current?.contains(e.target as Node);
    const mouseTargetInPopupRef = popupRef && popupRef.current?.contains(e.target as Node);
    const selection = window.getSelection()
    const selectedText = selection?.toString() ?? ""

    if (mouseTargetInSelectionRef && !mouseTargetInPopupRef) {
      const range = selection?.getRangeAt(0);
      const anchorEl = commentItemRef.current;
      
      if (anchorEl instanceof HTMLElement && selectedText?.length > 1 ) {  
        setAnchorEl(anchorEl);
        setQuote(selectedText);
        setYOffset(getYOffsetFromDocument(e, commentItemRef));
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
    <div className={classes.root}>
      <LWPopper
        open={!!anchorEl} anchorEl={anchorEl}
        placement="right"
        allowOverflow={true}
      >
        <span ref={popupRef} className={classes.button} 
          style={{position:"relative", top: yOffset, marginLeft: 12}}
        >
          <AddInlineReactionButton quote={quote} voteProps={voteProps} commentItemRef={commentItemRef} plaintext={comment.contents?.plaintextMainText}/>
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

