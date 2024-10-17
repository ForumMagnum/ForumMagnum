import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import IconButton from '@material-ui/core/IconButton';
import Transition from 'react-transition-group/Transition';
import { useVoteColors } from './useVoteColors';
import type { VoteColor } from './voteColors';
import { isEAForum } from '../../lib/instanceSettings';
import { SoftUpArrowIcon } from '../icons/softUpArrowIcon';
import { SoftUpArrowIconCap } from '../icons/softUpArrowIconCap';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    color: theme.palette.grey[400],
    fontSize: 'inherit',
    width: 'initial',
    height: 'initial',
    padding: 0,
    '&:hover': {
      backgroundColor: 'transparent',
    }
  },
  disabled: {
    cursor: 'not-allowed',
  },
  smallArrow: {
    fontSize: '60%',
    opacity: isEAForum ? 0.7 : 0.6
  },
  up: {
    bottom: '2px'
  },
  right: {
    transform: 'rotate(-270deg)',
  },
  down: {
    transform: 'rotate(-180deg)',
    top: '-1px'
  },
  left: {
    transform: 'rotate(-90deg)',
  },
  bigArrow: {
    position: 'absolute',
    top: '-70%',
    fontSize: '82%',
    opacity: 0,
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
  },
  bigArrowSolid: {
    // fontSize: '65%',
    top: "-35%",
    transform: 'scale(1.4)'
  },
  bigArrowCompleted: {
    fontSize: '90%',
    top: '-75%',
  },
  // Classes for the animation transitions of the bigArrow. See Transition component
  entering: {
    opacity: 1
  },
  entered: {
    opacity: 1
  },
  exiting: {
    transition: 'opacity 150ms cubic-bezier(0.74, -0.01, 1, 1) 0ms',
  }
})

export interface VoteArrowIconProps {
  solidArrow?: boolean,
  strongVoteDelay: number,
  orientation: "up"|"down"|"left"|"right",
  enabled?: boolean,
  color: VoteColor,
  voted: boolean,
  eventHandlers: {
    handleMouseDown?: () => void,
    handleMouseUp?: () => void,
    handleClick?: () => void,
    clearState?: () => void,
  },
  bigVotingTransition: boolean,
  bigVoted: boolean,
  bigVoteCompleted: boolean,
  alwaysColored: boolean,
}

const VoteArrowIcon = ({
  solidArrow,
  strongVoteDelay,
  orientation,
  enabled = true,
  color,
  voted,
  eventHandlers,
  bigVotingTransition,
  bigVoted,
  bigVoteCompleted,
  alwaysColored,
  classes,
}: VoteArrowIconProps & {
  classes: ClassesType
}) => {
  const {mainColor, lightColor} = useVoteColors(color);
  const Icon = solidArrow
  ?  <SoftUpArrowIcon
    style={{
      color: voted || alwaysColored ? mainColor : "inherit",
      height: 14,
      width: 14,
    }}
    className={classNames(
      classes.smallArrow,
    )}
  /> 
  : <UpArrowIcon
    style={{color: voted || alwaysColored ? mainColor : "inherit"}}
    className={classNames(
      classes.smallArrow,
      
    )}
    viewBox='6 6 12 12'
  /> 
  
  
  const getTransitionIcon = (state: string) => solidArrow
  ? <SoftUpArrowIconCap
    style={bigVoteCompleted || bigVoted ? {color: lightColor, height: 14, width: 14} : undefined}
    className={classNames(
      classes.bigArrow, 
      bigVoteCompleted && classes.bigArrowCompleted,
      solidArrow && classes.bigArrowSolid,
      classes[state]
    )}
  />
  : <UpArrowIcon
    style={bigVoteCompleted || bigVoted ? {color: lightColor} : undefined}
    className={classNames(
      classes.bigArrow,
      bigVoteCompleted && classes.bigArrowCompleted,
      solidArrow && classes.bigArrowSolid,
      classes[state]
    )}  
    viewBox='6 6 12 12'
  />
  

  if (!enabled) {
    eventHandlers = {};
  }


  return (
    <IconButton
      className={classNames(
        classes.root,
        classes[orientation],
        !enabled && classes.disabled,
      )}
      onMouseDown={eventHandlers.handleMouseDown}
      onMouseUp={eventHandlers.handleMouseUp}
      onMouseOut={eventHandlers.clearState}
      onClick={eventHandlers.handleClick}
      disableRipple
    >
      {Icon}
      <Transition in={!!(bigVotingTransition || bigVoted)} timeout={strongVoteDelay}>
        {(state) => (getTransitionIcon(state))}
      </Transition>
    </IconButton>
  )
}

const VoteIconComponent = registerComponent('VoteArrowIcon', VoteArrowIcon, {styles});

declare global {
  interface ComponentTypes {
    VoteArrowIcon: typeof VoteIconComponent
  }
}
