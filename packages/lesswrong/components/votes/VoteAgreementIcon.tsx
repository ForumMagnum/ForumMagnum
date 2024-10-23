import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTheme } from '../themes/useTheme';
import classNames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import { useVoteColors } from './useVoteColors';
import { BaseVoteArrowIconProps } from './VoteArrowIcon';

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[400],
    fontSize: 'inherit',
    width: 'initial',
    height: 'initial',
    padding: 0,
    bottom: 2,
    '&:hover': {
      backgroundColor: 'transparent',
    }
  },
  check: {
    fontSize: '50%',
    opacity: 0.6,
    height: 15,
    position: 'absolute',
    top: 3,
    left: 2,
  },
  bigCheck: {
    opacity: 0,
    position: 'absolute',
    top: -3,
    left: 2,
    fontSize: '82%',
    height: 23,
    pointerEvents: 'none'
  },
  bigCheckCompleted: {
    opacity: 1,
  },
  smallCheckBigVoted: {
    fontSize: '50%',
    opacity: 0.6,
    position: 'absolute',
    height: 14,
    transform: 'translate(-8px, -2px)'
  },
  clear: {
    fontSize: '45%',
    opacity: 0.6,
    position: 'absolute',
    top: 6,
    left: 11
  },
  bigClear: {
    opacity: 0,
    position: 'absolute',
    top: 1,
    left: 5,
    fontSize: '70%',
    pointerEvents: 'none',
  },
  bigClearCompleted: {
    opacity: 1,
    fontSize: '80%',
    position: 'absolute',
    left: 4,
    top: 0,
  },
  smallArrowBigVoted: {
    opacity: 0.6,
    position: 'absolute',
    height: 14,
    scale: 1.4,
    transform: 'translate(-2.5px, 2.3px)'
  },
  hideIcon: {
    opacity: 0
  },
  iconsContainer: {
    position: 'relative',
    width: 25,
    height: 18
  },
  disabled: {
    cursor: 'not-allowed',
  },
  entering: {
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
  }
})

const VoteAgreementIcon = ({
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
}: BaseVoteArrowIconProps & {
  classes: ClassesType<typeof styles>
}) => {
  const upOrDown = orientation === "left" ? "Downvote" : "Upvote"
  
  const primaryIcon =  (upOrDown === "Downvote") ? "CrossReaction" : "TickReaction"
  const bigVoteAccentIcon = (upOrDown === "Downvote") ? "CrossReactionCap" : "TickReaction"

  const handlers = enabled ? eventHandlers : {};

  const {mainColor, lightColor} = useVoteColors(color);

  const { ForumIcon } = Components;

  const strongVoteLargeIconClasses = (upOrDown === "Downvote")
    ? classNames(
      bigVotingTransition && classes.entering,
      classes.bigClear,
      (bigVotingTransition || bigVoteCompleted || bigVoted) && classes.bigClearCompleted,
    )
    : classNames(
      bigVotingTransition && classes.entering,
      classes.bigCheck,
      (bigVotingTransition || bigVoteCompleted || bigVoted) && classes.bigCheckCompleted,
    )

  const strongVoteAccentIconClasses = (upOrDown === "Downvote")
    ? classNames(
      bigVotingTransition && classes.entering,
      classes.smallArrowBigVoted,
      (bigVotingTransition || bigVoteCompleted || bigVoted) && classes.smallArrowBigVoted,
      {[classes.hideIcon]: !bigVoted}
    )
    : classNames(
      bigVotingTransition && classes.entering,
      classes.smallCheckBigVoted,
      (bigVotingTransition || bigVoteCompleted || bigVoted) && classes.smallCheckBigVoted,
      {[classes.hideIcon]: !bigVoted}
    )

  
  
  return (
    <IconButton
      className={classNames(classes.root, {[classes.disabled]: !enabled})}
      onMouseDown={handlers.handleMouseDown}
      onMouseUp={handlers.handleMouseUp}
      onMouseOut={handlers.clearState}
      onClick={handlers.handleClick}
      disableRipple
    >
      <span className={classes.iconsContainer}>
        <ForumIcon
          icon={primaryIcon}  
          className={classNames(
            (upOrDown === "Downvote") ? classes.clear : classes.check,
            (bigVotingTransition || bigVoteCompleted || bigVoted) && classes.hideIcon
          )}
          style={{color: voted || alwaysColored ? mainColor : "inherit"}}
        />

        {/* Strong vote icons */}
        <ForumIcon
          icon={primaryIcon}
          style={bigVoteCompleted || bigVoted ? {color: lightColor} : {}}
          className={strongVoteLargeIconClasses}
        />
        <ForumIcon
          icon={bigVoteAccentIcon}
          style={bigVoteCompleted || bigVoted ? {color: lightColor} : undefined}
          className={strongVoteAccentIconClasses}
        />






        {/* <Transition in={(bigVotingTransition || bigVoted)} timeout={theme.voting.strongVoteDelay}>
          {(state) => (
            <>
              <ForumIcon
                icon={bigVoteAccentIcon}
                className={classNames(bigVoteAccentStyling, classes.noClickCatch, {[classes.hideIcon]: !bigVoted})}
                style={bigVoteCompleted || bigVoted ? {color: lightColor} : undefined}
              />
              <ForumIcon
                icon={primaryIcon}
                style={bigVoteCompleted || bigVoted ? {color: lightColor} : undefined}
                className={classNames(bigVoteStyling, classes.noClickCatch, {
                  [bigVoteCompletedStyling]: bigVoteCompleted,
                  // [classes.bigCheckCompleted]: bigVoteCompleted,
                }, classes[state])}
              />
            </>)}
        </Transition> */}
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




