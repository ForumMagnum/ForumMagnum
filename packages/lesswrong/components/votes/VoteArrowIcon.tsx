import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import IconButton from '@material-ui/core/IconButton';
import Transition from 'react-transition-group/Transition';
import { VoteColor, cssVoteColors } from './voteColors';

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
    fontSize: '50%',
    opacity: 0.6
  },
  up: {},
  right: {
    transform: 'rotate(-270deg)',
  },
  down: {
    transform: 'rotate(-180deg)',
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
    fontSize: '65%',
    top: "-45%"
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
    handleMouseDown?: ()=>void,
    handleMouseUp?: ()=>void,
    handleClick?: ()=>void,
    clearState?: ()=>void,
  },
  bigVotingTransition: boolean,
  bigVoted: boolean,
  bigVoteCompleted: boolean,
  alwaysColored: boolean,
}

const VoteArrowIcon = ({ solidArrow, strongVoteDelay, orientation, enabled = true, color, voted, eventHandlers, bigVotingTransition, bigVoted, bigVoteCompleted, alwaysColored, classes }: VoteArrowIconProps & {
  classes: ClassesType
}) => {
  const Icon = solidArrow ? ArrowDropUpIcon : UpArrowIcon

  if (!enabled) {
    eventHandlers = {};
  }

  return (
    <IconButton
      className={classNames(classes.root, classes[orientation], {[classes.disabled]: !enabled})}
      onMouseDown={eventHandlers.handleMouseDown}
      onMouseUp={eventHandlers.handleMouseUp}
      onMouseOut={eventHandlers.clearState}
      onClick={eventHandlers.handleClick}
      disableRipple
    >
      <Icon
        className={classes.smallArrow}
        color={(voted || alwaysColored) ? color : 'inherit'}
        viewBox='6 6 12 12'
      />
      <Transition in={!!(bigVotingTransition || bigVoted)} timeout={strongVoteDelay}>
        {(state) => (
          <UpArrowIcon
            style={bigVoteCompleted ? {color: cssVoteColors[color]} : undefined}
            className={classNames(classes.bigArrow, {[classes.bigArrowCompleted]: bigVoteCompleted, [classes.bigArrowSolid]: solidArrow}, classes[state])}
            color={(bigVoted || bigVoteCompleted) ? color : 'inherit'}
            viewBox='6 6 12 12'
          />)}
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
