import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getVotingSystemByName } from '../../lib/voting/votingSystems';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useNamesAttachedReactionsVoting } from '../votes/NamesAttachedReactionsVoteOnComment';
import { useVote } from '../votes/withVote';

const styles = (theme: ThemeType): JssStyles => ({
  button: {
    zIndex: 1000,
    backgroundColor: theme.palette.background.paper,
    borderRadius: 4,
    boxShadow: theme.shadows[2],
    padding: 4,
    width: 100,
    height: 100
  }
});

export const SelectionButtonWrapper = ({classes, comment, children}: {
  classes: ClassesType,
  comment: CommentsList,
  children: React.ReactNode,
}) => {
  const selectionRef = useRef<HTMLDivElement|null>(null);
  const popupRef = useRef<HTMLDivElement|null>(null);
  const [quote, setQuote] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);

  const { PopperCard, AddReactionButton, ReactionsPalette } = Components;

  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const voteProps = useVote(comment, "Comments", votingSystem);
  
  const { getCurrentUserReactionVote, toggleReaction } = useNamesAttachedReactionsVoting(voteProps);

  // note: I originally just made this a function. ChatGPT claimed that it would
  // result in a memory leak because it would create a new function every time
  // the component re-renders. I don't know if that's true, but I'm using
  // useCallback to memoize it just in case.
  // ChatGPT also... generated this note, so watch out for that
  const detectSelection = useCallback((e: MouseEvent): void => {
    const mouseTargetInSelectionRef = selectionRef && selectionRef.current?.contains(e.target as Node);
    const mouseTargetInPopupRef = popupRef && popupRef.current?.contains(e.target as Node);
    const selection = window.getSelection()
    const selectedText = selection?.toString() ?? ""

    if (mouseTargetInSelectionRef && !mouseTargetInPopupRef) {
      const range = selection?.getRangeAt(0);
      const anchorEl = range?.startContainer.parentNode;
      if (anchorEl instanceof HTMLElement && selectedText?.length > 10 ) {  
        setAnchorEl(anchorEl);
        setQuote(selectedText);
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
  }, []);

  return (
    <div ref={selectionRef}>
      <PopperCard
        open={!!anchorEl} anchorEl={anchorEl}
        placement="right"
        allowOverflow={true}
      >
        <span ref={popupRef}>
          <ReactionsPalette
            getCurrentUserReactionVote={getCurrentUserReactionVote}
            toggleReaction={toggleReaction}
            quote={quote} 
          />
        </span>
      </PopperCard>
      {children}
    </div>
  );
}

const SelectionButtonWrapperComponent = registerComponent('SelectionButtonWrapper', SelectionButtonWrapper, {styles});

declare global {
  interface ComponentTypes {
    SelectionButtonWrapper: typeof SelectionButtonWrapperComponent
  }
}

