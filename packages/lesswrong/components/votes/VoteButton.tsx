import { registerComponent, Components } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import classNames from 'classnames';
import { isMobile } from '../../lib/utils/isMobile'
import { withTheme } from '@material-ui/core/styles';
import type { VoteArrowProps } from './VoteArrow';

const styles = (theme: ThemeType): JssStyles => ({
})

const VoteButton = ({
  vote, currentStrength, upOrDown,
  color = "secondary",
  orientation = "up",
  solidArrow,
  VoteArrowComponent,
  theme,
}: {
  vote: (strength: "big"|"small"|"neutral")=>void,
  currentStrength: "big"|"small"|"neutral",
  
  upOrDown: "Upvote"|"Downvote",
  color: "error"|"primary"|"secondary",
  orientation: "up"|"down"|"left"|"right",
  solidArrow?: boolean
  VoteArrowComponent: React.ComponentType<VoteArrowProps>,
  // From withTheme. TODO: Hookify this.
  theme?: ThemeType
}) => {
  const [votingTransition, setVotingTransition] = useState<any>(null);
  const [bigVotingTransition, setBigVotingTransition] = useState(false);
  const [bigVoteCompleted, setBigVoteCompleted] = useState(false);
  const strongVoteDelay = theme.voting.strongVoteDelay;
  
  const wrappedVote = (strength: "big"|"small"|"neutral") => {
    if (currentStrength === "small")
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
    solidArrow, strongVoteDelay, orientation, color, voted,
    bigVotingTransition, bigVoted,
    bigVoteCompleted, theme,
    eventHandlers: {handleMouseDown, handleMouseUp, handleClick, clearState},
    alwaysColored: false,
  };
  return <VoteArrowComponent {...voteArrowProps} />
}

const VoteButtonComponent = registerComponent('VoteButton', VoteButton, {
  hocs: [withTheme()], areEqual: "auto"
});

declare global {
  interface ComponentTypes {
    VoteButton: typeof VoteButtonComponent
  }
}

