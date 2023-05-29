import Mark from 'mark.js';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getVotingSystemByName } from '../../lib/voting/votingSystems';
import { registerComponent, Components } from '../../lib/vulcan-lib';
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
  commentItemRef?: React.RefObject<HTMLDivElement>|null // we need this to check if the mouse is still over the comment, and it needs to be passed down from CommentsItem instead of declared here because it needs extra padding in order to behave intuively (without losing the selection)
}) => {
  const commentTextRef = useRef<HTMLDivElement|null>(null);
  const popupRef = useRef<HTMLDivElement|null>(null);
  const [quote, setQuote] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  const [yOffset, setYOffset] = useState<number>(0);

  const { AddInlineReactionButton, LWPopper } = Components;

  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const voteProps = useVote(comment, "Comments", votingSystem);
  

  function getYOffsetFromDocument (e: MouseEvent, commentTextRef: React.RefObject<HTMLDivElement>) {
    const commentTextRect = commentTextRef.current?.getBoundingClientRect();
    if (!commentTextRect) return 0;
    const documentCenter = commentTextRect?.top + (commentTextRect?.height / 2);
    const mousePosition = e.clientY;
    return mousePosition - documentCenter;
  }

  // clean up any stray highlights when you click.
  // there are a few ways a user can end up with a stray highlight that 
  // I'm not sure how else to fix - ray
  function unMark() {
    const ref = commentItemRef?.current
    if (!ref) return
    let markInstance = new Mark(ref);
    markInstance.unmark({className: hideSelectorClassName});
  }

  const detectSelection = useCallback((e: MouseEvent): void => {
    const mouseTargetInSelectionRef = commentItemRef && commentItemRef.current?.contains(e.target as Node);
    const mouseTargetInPopupRef = popupRef && popupRef.current?.contains(e.target as Node);
    const selection = window.getSelection()
    const selectedText = selection?.toString() ?? ""

    if (mouseTargetInSelectionRef && !mouseTargetInPopupRef) {
      const anchorEl = commentItemRef.current;
      
      if (anchorEl instanceof HTMLElement && selectedText?.length > 1 ) {  
        setAnchorEl(anchorEl);
        setQuote(selectedText);
        setYOffset(getYOffsetFromDocument(e, commentTextRef));
      } else {
        setAnchorEl(null);
        setQuote("")
        unMark()
      }
    }
    if (!mouseTargetInSelectionRef && !mouseTargetInPopupRef) {
      setAnchorEl(null);
      setQuote("")
      unMark()
    }
  }, []);
  useEffect(() => { 
    document.addEventListener('mouseup', detectSelection);
    return () => {
      document.removeEventListener('mouseup', detectSelection);
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
          <AddInlineReactionButton quote={quote} voteProps={voteProps} commentItemRef={commentItemRef}/>
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

