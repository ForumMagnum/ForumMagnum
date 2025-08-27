import React from 'react';
import classNames from 'classnames';
import { BaseVoteArrowIconProps } from './VoteArrowIcon';
import ForumIcon from "../common/ForumIcon";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getVoteButtonColor, voteButtonSharedStyles } from './VoteButton';

const styles = defineStyles("VoteAgreementIcon", (theme: ThemeType) => ({
  root: {
    bottom: 2,
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
}))

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
}: BaseVoteArrowIconProps) => {
  const classes = useStyles(styles);
  const sharedClasses = useStyles(voteButtonSharedStyles);
  const upOrDown = orientation === "left" ? "Downvote" : "Upvote"
  
  const primaryIcon =  (upOrDown === "Downvote") ? "CrossReaction" : "TickReaction"
  const bigVoteAccentIcon = (upOrDown === "Downvote") ? "CrossReactionCap" : "TickReaction"

  const handlers = enabled ? eventHandlers : {};

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
    <button
      className={classNames(
        classes.root,
        sharedClasses.root,
        !enabled && classes.disabled,
      )}
      type="button"
      onMouseDown={handlers.handleMouseDown}
      onMouseUp={handlers.handleMouseUp}
      onMouseOut={handlers.clearState}
      onClick={handlers.handleClick}
    >
    <span className={sharedClasses.inner}>
      <div className={classes.iconsContainer}>
        <ForumIcon
          icon={primaryIcon}
          className={classNames(
            (upOrDown === "Downvote") ? classes.clear : classes.check,
            bigVoteVisible && classes.hideIcon,
            (voted || alwaysColored) && getVoteButtonColor(sharedClasses, color, "main"),
          )}
        />

        {/* Strong vote icons */}
        <ForumIcon
          icon={primaryIcon}
          className={classNames(
            strongVoteLargeIconClasses,
            (bigVoteCompleted || bigVoted) && getVoteButtonColor(sharedClasses, color, "light"),
          )}
        />
        <ForumIcon
          icon={bigVoteAccentIcon}
          className={classNames(
            strongVoteAccentIconClasses,
            (bigVoteCompleted || bigVoted) && getVoteButtonColor(sharedClasses, color, "light"),
          )}
        />
      </div>
    </span>
    </button>
  )
}

export default VoteAgreementIcon;
