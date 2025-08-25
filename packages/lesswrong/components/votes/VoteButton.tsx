import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isMobile } from '../../lib/utils/isMobile'
import { useTheme } from '../themes/useTheme';
import type { VoteArrowIconProps } from './VoteArrowIcon';
import { defineStyles } from '../hooks/useStyles';
import { JssStyles } from '@/lib/jssStyles';

export type VoteColor = "error"|"primary"|"secondary";

export const voteButtonSharedStyles = defineStyles("VoteButton", theme => ({
  root: {
    color: theme.palette.grey[400],
    fontSize: 'inherit',
    width: 'initial',
    height: 'initial',
    padding: 0,
    '&:hover': {
      backgroundColor: 'transparent',
    },
    
    // Refactored from MuiIconButton-root
    textAlign: 'center',
    flex: '0 0 auto',
    borderRadius: '50%',
    overflow: 'visible', // Explicitly set the default value to solve a bug on IE11.
    transition: theme.transitions.create('background-color', {
      duration: theme.transitions.duration.shortest,
    }),
    
    // Refactored from ButtonBase-root
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Remove grey highlight
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'transparent', // Reset default value
    // We disable the focus ring for mouse, touch and keyboard users.
    outline: 'none',
    border: 0,
    margin: 0, // Remove the margin in Safari
    cursor: 'pointer',
    userSelect: 'none',
    verticalAlign: 'middle',
    '-moz-appearance': 'none', // Reset
    '-webkit-appearance': 'none', // Reset
    textDecoration: 'none',
    // So we take precedent over the style of a native <a /> element.
    '&::-moz-focus-inner': {
      borderStyle: 'none', // Remove Firefox dotted outline.
    },
  },
  inner: {
    // Refactored from MuiIconButtonlabel
    width: '100%',
    display: 'flex',
    alignItems: 'inherit',
    justifyContent: 'inherit',
  },
  colorMainPrimary: {
    color: theme.palette.primary.main,
  },
  colorMainSecondary: {
    color: theme.palette.secondary.main,
  },
  colorMainError: {
    color: theme.palette.error.main,
  },
  colorLightPrimary: {
    color: theme.palette.primary.light,
  },
  colorLightSecondary: {
    color: theme.palette.secondary.light,
  },
  colorLightError: {
    color: theme.palette.error.light,
  },
}));

export const getVoteButtonColor = (classes: JssStyles<keyof ReturnType<typeof voteButtonSharedStyles.styles>>, color: VoteColor, shade: "main"|"light") => {
  if (shade === 'main') {
    switch(color) {
      case "error":     return classes.colorMainError;
      case "primary":   return classes.colorMainPrimary;
      case "secondary": return classes.colorMainSecondary;
    }
  } else {
    switch(color) {
      case "error":     return classes.colorLightError;
      case "primary":   return classes.colorLightPrimary;
      case "secondary": return classes.colorLightSecondary;
    }
  }
}

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
  color: VoteColor,
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

export default registerComponent('VoteButton', VoteButton, {
  areEqual: "auto"
});



