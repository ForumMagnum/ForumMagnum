import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isMobile } from '../../lib/utils/isMobile'
import { useTheme } from '../themes/useTheme';
import type { VoteArrowIconProps } from './VoteArrowIcon';

const styles = (theme: ThemeType) => ({
})

const VoteButton = ({
  vote, currentStrength, upOrDown,
  color = "secondary",
  orientation = "up",
  enabled,
  solidArrow,
  largeArrow,
  VoteIconComponent,
}: {
  vote: (strength: "big"|"small"|"neutral") => void,
  currentStrength: "big"|"small"|"neutral",
  
  upOrDown: "Upvote"|"Downvote",
  color: "error"|"primary"|"secondary",
  orientation: "up"|"down"|"left"|"right",
  enabled: boolean,
  solidArrow?: boolean,
  largeArrow?: boolean,
  VoteIconComponent: React.ComponentType<VoteArrowIconProps>,
}) => {
  const theme = useTheme();
  const [votingTransition, setVotingTransition] = useState<any>(null);
  const [bigVotingTransition, setBigVotingTransition] = useState(false);
  const [bigVoteCompleted, setBigVoteCompleted] = useState(false);
  const strongVoteDelay = theme.voting.strongVoteDelay;
  
  const wrappedVote = (strength: "big"|"small"|"neutral") => {
    if (strength === currentStrength)
      vote("neutral")
    else
      vote(strength);
  }

  const handleMouseDown = () => { // This handler is only used on desktop
    if(!isMobile()) {
      setBigVotingTransition(true);
      setVotingTransition(setTimeout(() => {
        setBigVoteCompleted(true);
      }, strongVoteDelay))
    }
  }

  const clearState = () => {
    clearTimeout(votingTransition);
    setBigVotingTransition(false);
    setBigVoteCompleted(false);
  }

  const handleMouseUp = () => { // This handler is only used on desktop
    if(!isMobile()) {
      if (bigVoteCompleted) {
        wrappedVote("big")
      } else {
        wrappedVote("small")
      }
      clearState()
    }
  }

  const voted = currentStrength !== "neutral";
  const bigVoted = currentStrength === "big";
  
  const handleClick = () => { // This handler is only used for mobile
    if(isMobile()) {
      // This causes the following behavior (repeating after 3rd click):
      // 1st Click: small upvote; 2nd Click: big upvote; 3rd Click: cancel big upvote (i.e. going back to no vote)
      if (voted) {
        wrappedVote("big")
      } else {
        wrappedVote("small")
      }
      clearState()
    }
  }

  const voteArrowProps = {
    solidArrow, largeArrow, strongVoteDelay, orientation, enabled, color, voted,
    bigVotingTransition, bigVoted,
    bigVoteCompleted, theme,
    eventHandlers: {handleMouseDown, handleMouseUp, handleClick, clearState},
    alwaysColored: false,
  };
  return <VoteIconComponent {...voteArrowProps} />
}

const VoteButtonComponent = registerComponent('VoteButton', VoteButton, {
  areEqual: "auto"
});

declare global {
  interface ComponentTypes {
    VoteButton: typeof VoteButtonComponent
  }
}

