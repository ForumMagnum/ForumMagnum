import React, { useReducer, useRef } from 'react';
import { isMobile } from '../../lib/utils/isMobile'
import { defineStyles } from '../hooks/useStyles';
import { JssStyles } from '@/lib/jssStyles';
import { strongVoteDelay } from './constants';

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
  entering: {
    animation: `${strongVoteDelay}ms 1 normal strongVote`,
    transition: `opacity ${strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
    //transition: `opacity ${strongVoteDelay}ms linear 0ms`,
  },
  "@keyframes strongVote": {
    from: { opacity: 0 },
    to: {
      opacity: 0.7,
    }
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

type VoteStrength = "big"|"small"|"neutral";
type VoteButtonAnimationState =
    { mode: "idle", vote: VoteStrength }
  | { mode: "animating", from: VoteStrength, timer: ReturnType<typeof setTimeout> }
  | { mode: "completed", from: VoteStrength }
export type VoteButtonAnimationHandlers = {
  state: VoteButtonAnimationState
  eventHandlers: {
    onMouseDown: any,
    onMouseUp: any,
    onMouseOut: any,
    onClick: any
  }
}

export const VoteButtonAnimation = ({
  vote, currentStrength,
  children,
}: {
  vote: (strength: "big"|"small"|"neutral") => void,
  currentStrength: "big"|"small"|"neutral",
  solidArrow?: boolean,
  largeArrow?: boolean,
  children: (animationHandlers: VoteButtonAnimationHandlers) => React.ReactNode
}) => {
  const [_renderCount, forceRerender] = useReducer(c => c+1, 0);
  const animationState = useRef<VoteButtonAnimationState>({
    mode: "idle",
    vote: currentStrength
    
  });
  const handleMouseDown = () => { // This handler is only used on desktop
    if(!isMobile()) {
      if (animationState.current.mode === "idle") {
        if (animationState.current.vote === "big") {
          vote("small");
          animationState.current = {
            mode: "idle",
            vote: "small",
          };
        } else {
          const initialVote = animationState.current.vote;
          animationState.current = {
            mode: "animating",
            from: initialVote,
            timer: setTimeout(() => {
              if (animationState.current.mode === "animating") {
                clearTimeout(animationState.current.timer);
              }
              animationState.current = {
                mode: "completed",
                from: initialVote,
              };
              forceRerender();
            }, strongVoteDelay),
          };
        }
      }
      forceRerender();
    }
  }

  const clearState = () => {
    if (animationState.current.mode === "animating") {
      clearTimeout(animationState.current.timer);
      animationState.current = { mode: "idle", vote: animationState.current.from };
      forceRerender();
    }
  }

  const handleMouseUp = () => { // This handler is only used on desktop
    if(!isMobile()) {
      if (animationState.current.mode === "completed") {
        vote("big");
        animationState.current = {
          mode: "idle",
          vote: "big",
        };
      } else if (animationState.current.mode === "animating") {
        clearTimeout(animationState.current.timer);
        if (animationState.current.from === "neutral") {
          vote("small");
          animationState.current = {
            mode: "idle",
            vote: "small",
          };
        } else if (animationState.current.from === "small") {
          vote("neutral");
          animationState.current = {
            mode: "idle",
            vote: "neutral",
          };
        }
      }
      forceRerender();
    }
  }
  
  const handleClick = () => { // This handler is only used for mobile
    if(isMobile()) {
      // This causes the following behavior (repeating after 3rd click):
      // 1st Click: small upvote; 2nd Click: big upvote; 3rd Click: cancel big upvote (i.e. going back to no vote)
      if (currentStrength === "small") {
        vote("big")
        animationState.current = {
          mode: "idle",
          vote: "big",
        };
      } else if (currentStrength === "neutral") {
        vote("small")
        animationState.current = {
          mode: "idle",
          vote: "small",
        };
      } else {
        vote("neutral")
        animationState.current = {
          mode: "idle",
          vote: "neutral",
        };
      }
      clearState()
    }
  }
  
  const handleMouseOut = () => {
    handleMouseUp();
  }

  return children({
    eventHandlers: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onClick: handleClick,
      onMouseOut: handleMouseOut
    },
    state: animationState.current,
  });
}
