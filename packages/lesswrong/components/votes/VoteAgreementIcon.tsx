import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useTheme } from '../themes/useTheme';
import classNames from 'classnames';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
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
    transform: 'translate(-4.5px, -2px)'
  },
  clear: {
    fontSize: '45%',
    opacity: 0.6,
    position: 'absolute',
    top: 6,
    left: 4
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
    left: -2,
    top: 0,
    pointerEvents: 'none'
  },
  smallArrowBigVoted: {
    opacity: 0.6,
    position: 'absolute',
    height: 14,
    transform: 'scale(1.4) translate(-4.1px, 2.3px)',
    pointerEvents: 'none',
  },
  hideIcon: {
    opacity: 0
  },
  iconsContainer: {
    position: 'relative',
    width: 18,
    height: 18,
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

  const bigVoteVisible = bigVotingTransition || bigVoteCompleted || bigVoted

  const strongVoteLargeIconClasses = (upOrDown === "Downvote")
    ? classNames(
      bigVotingTransition && classes.entering,
      classes.bigClear,
      bigVoteVisible && classes.bigClearCompleted,
    )
    : classNames(
      bigVotingTransition && classes.entering,
      classes.bigCheck,
      bigVoteVisible && classes.bigCheckCompleted,
    )

  const strongVoteAccentIconClasses = (upOrDown === "Downvote")
    ? classNames(
      bigVotingTransition && classes.entering,
      classes.smallArrowBigVoted,
      bigVoteVisible && classes.smallArrowBigVoted,
      {[classes.hideIcon]: !bigVoted}
    )
    : classNames(
      bigVotingTransition && classes.entering,
      classes.smallCheckBigVoted,
      bigVoteVisible && classes.smallCheckBigVoted,
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
      <div className={classes.iconsContainer}>
        <ForumIcon
          icon={primaryIcon}  
          className={classNames(
            (upOrDown === "Downvote") ? classes.clear : classes.check,
            bigVoteVisible && classes.hideIcon
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
      </div>
    </IconButton>
  )
}

const VoteAgreementIconComponent = registerComponent('VoteAgreementIcon', VoteAgreementIcon, {styles});

declare global {
  interface ComponentTypes {
    VoteAgreementIcon: typeof VoteAgreementIconComponent
  }
}




