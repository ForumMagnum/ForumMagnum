import React from 'react';
import classNames from 'classnames';
import { BaseVoteArrowIconProps } from './VoteArrowIcon';
import ForumIcon from "../common/ForumIcon";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getVoteButtonColor, voteButtonSharedStyles } from './VoteButton';
import { strongVoteDelay } from './constants';

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
}))

const VoteAgreementIcon = ({
  orientation,
  enabled = true,
  color,
  animation,
  alwaysColored,
}: BaseVoteArrowIconProps) => {
  const classes = useStyles(styles);
  const { state, eventHandlers } = animation;
  const sharedClasses = useStyles(voteButtonSharedStyles);
  const upOrDown = orientation === "left" ? "Downvote" : "Upvote"
  
  const primaryIcon =  (upOrDown === "Downvote") ? "CrossReaction" : "TickReaction"
  const bigVoteAccentIcon = (upOrDown === "Downvote") ? "CrossReactionCap" : "TickReaction"

  const bigVoteVisible = (state.mode==="idle" && state.vote==="big") || (state.mode !== "idle");

  const voted = state.mode !== "idle" || state.vote !== "neutral";
  const bigVoted = state.mode !== "idle" || state.vote === "big";

  return (
    <button
      className={classNames(
        classes.root,
        sharedClasses.root,
        !enabled && classes.disabled,
      )}
      type="button"
      {...(enabled ? eventHandlers : {})}
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
        {((state.mode==="idle" && state.vote==="big") || (state.mode !== "idle")) && <>
          <ForumIcon
            icon={primaryIcon}
            className={classNames(
              state.mode === "animating" && sharedClasses.entering,
              (upOrDown === "Downvote") ? classes.bigClear : classes.bigCheck,
              bigVoteVisible && ((upOrDown === "Downvote") ? classes.bigClearCompleted : classes.bigCheckCompleted),
              getVoteButtonColor(sharedClasses, color, "light"),
            )}
          />
          <ForumIcon
            icon={bigVoteAccentIcon}
            className={classNames(
              state.mode === "animating" && sharedClasses.entering,
              (upOrDown === "Downvote") ? classes.smallArrowBigVoted : classes.smallCheckBigVoted,
              bigVoteVisible && (upOrDown === "Downvote") ? classes.smallArrowBigVoted : classes.smallCheckBigVoted,
              !bigVoted && classes.hideIcon,
              getVoteButtonColor(sharedClasses, color, "light"),
            )}
          />
        </>}
      </div>
    </span>
    </button>
  )
}

export default VoteAgreementIcon;
