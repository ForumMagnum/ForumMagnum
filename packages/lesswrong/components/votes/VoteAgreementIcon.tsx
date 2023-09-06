import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTheme } from '../themes/useTheme';
import classNames from 'classnames';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import IconButton from '@material-ui/core/IconButton';
import Transition from 'react-transition-group/Transition';
import { VoteColor, cssLightVoteColors, cssMainVoteColors } from './voteColors';
import { isEAForum } from '../../lib/instanceSettings';

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
  bigCheck: {
    position: 'absolute',
    top: -3,
    left: 2,
    fontSize: '82%',
    opacity: 0,
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
    height: 23
  },
  bigCheckSolid: {
    fontSize: '65%',
    top: "-45%"
  },
  bigCheckCompleted: {
    // fontSize: '90%',
    // top: '-75%',
    // left: 0
  },
  bigClear: {
    position: 'absolute',
    top: 1,
    left: 5,
    fontSize: '70%',
    opacity: 0,
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
  },
  bigClearSolid: {
    fontSize: '65%',
    position: 'relative',
    top: "-45%"
  },
  bigClearCompleted: {
    fontSize: '80%',
    position: 'absolute',
    left: 4,
    top: 0,
  },
  hideIcon: {
    display: 'none'
  },
  check: {
    fontSize: '50%',
    opacity: 0.6,
    height: 15,
    position: 'absolute',
    top: 2,
    left: 3
  },
  clear: {
    fontSize: '45%',
    opacity: 0.6,
    position: 'absolute',
    top: 5,
    left: 11
  },
  smallCheckBigVoted: {
    fontSize: '50%',
    opacity: 0.6,
    position: 'absolute',
    top: -1,
    left: 4,
    height: 14
  },
  smallArrowBigVoted: {
    fontSize: '47%',
    opacity: 0.6,
    transform: 'rotate(-90deg)',
    position: 'absolute',
    height: 14,
    top: 3,
    left: 17
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
  },
  iconsContainer: {
    position: 'relative',
    width: 25,
    height: 18
  },
  noClickCatch: {
    /* pointerEvents: none prevents elements under the IconButton from interfering with mouse
       events during a bigVote transition. */
    pointerEvents: 'none'
  },
  disabled: {
    cursor: 'not-allowed',
  },
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

const VoteAgreementIcon = ({
  solidArrow,
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

  const theme = useTheme();
  const upOrDown = orientation === "left" ? "Downvote" : "Upvote"
  
  const PrimaryIcon =  (upOrDown === "Downvote") ? ClearIcon : CheckIcon
  const primaryIconStyling = (upOrDown === "Downvote") ? classes.clear : classes.check
  
  const BigVoteAccentIcon = (upOrDown === "Downvote") ? UpArrowIcon: CheckIcon
  const bigVoteAccentStyling = (upOrDown === "Downvote") ? classes.smallArrowBigVoted : classes.smallCheckBigVoted
  const bigVoteCompletedStyling = (upOrDown === "Downvote") ? classes.bigClearCompleted : classes.bigCheckCompleted
  const bigVoteStyling = (upOrDown === "Downvote") ? classes.bigClear : classes.bigCheck

  if (!enabled) {
    eventHandlers = {};
  }

  const cssColor = isEAForum && color === "secondary" ? "greenUpvote" : color;
  const mainColor = cssMainVoteColors[cssColor];
  const lightColor = cssLightVoteColors[cssColor];

  return (
    <IconButton
      className={classNames(classes.root, {[classes.disabled]: !enabled})}
      onMouseDown={eventHandlers.handleMouseDown}
      onMouseUp={eventHandlers.handleMouseUp}
      onMouseOut={eventHandlers.clearState}
      onClick={eventHandlers.handleClick}
      disableRipple
    >
      <span className={classes.iconsContainer}>
        <PrimaryIcon
          className={classNames(primaryIconStyling, classes.noClickCatch, {[classes.hideIcon]: bigVotingTransition || bigVoted})}
          style={{color: voted || alwaysColored ? mainColor : "inherit"}}
          viewBox='6 6 12 12'
        />
        <Transition in={(bigVotingTransition || bigVoted)} timeout={theme.voting.strongVoteDelay}>
          {(state) => (
            <>
              <BigVoteAccentIcon
                className={classNames(bigVoteAccentStyling, classes.noClickCatch, {[classes.hideIcon]: !bigVoted})}
                style={bigVoteCompleted || bigVoted ? {color: lightColor} : undefined}
                viewBox='6 6 12 12'
              />
              <PrimaryIcon
                style={bigVoteCompleted || bigVoted ? {color: lightColor} : undefined}
                className={classNames(bigVoteStyling, classes.noClickCatch, {
                  [bigVoteCompletedStyling]: bigVoteCompleted,
                  // [classes.bigCheckCompleted]: bigVoteCompleted,
                  [classes.bigCheckSolid]: solidArrow
                }, classes[state])}
                viewBox='6 6 12 12'
              />
            </>)}
        </Transition>
      </span>
    </IconButton>
  )
}

const VoteAgreementIconComponent = registerComponent('VoteAgreementIcon', VoteAgreementIcon, {styles});

declare global {
  interface ComponentTypes {
    VoteAgreementIcon: typeof VoteAgreementIconComponent
  }
}




