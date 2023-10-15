import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { isMobile } from '../../lib/utils/isMobile'
import { useTheme } from '../themes/useTheme';
import type { VoteArrowIconProps } from './VoteArrowIcon';

const styles = (theme: ThemeType): JssStyles => ({
})

const VoteButton = ({
  vote, currentStrength, upOrDown,
  color = "secondary",
  orientation = "up",
  enabled,
  solidArrow,
  VoteIconComponent,
}: {
  vote: (strength: "big"|"small"|"neutral")=>void,
  currentStrength: "big"|"small"|"neutral",
  
  upOrDown: "Upvote"|"Downvote",
  color: "error"|"primary"|"secondary",
  orientation: "up"|"down"|"left"|"right",
  enabled: boolean,
  solidArrow?: boolean
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

  const clearState = () => {
    clearTimeout(votingTransition);
    setBigVotingTransition(false);
    setBigVoteCompleted(false);
  }

  const voted = currentStrength !== "neutral";
  const bigVoted = currentStrength === "big";
  
  const handleClick = () => { // This handler is only used for mobile
    wrappedVote("small")
  }

  const voteArrowProps = {
    solidArrow, strongVoteDelay, orientation, enabled, color, voted,
    bigVotingTransition, bigVoted,
    bigVoteCompleted, theme,
    eventHandlers: {handleClick, clearState},
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

