import React from 'react';
import classNames from 'classnames';
import { SoftUpArrowIcon } from '../icons/softUpArrowIcon';
import { SoftUpArrowIconCap } from '../icons/softUpArrowIconCap';
import { isEAForum } from '../../lib/instanceSettings';
import type { BaseVoteArrowIconProps } from './VoteArrowIcon';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getVoteButtonColor, voteButtonSharedStyles } from './VoteButton';

const styles = defineStyles("VoteArrowIconSolid", (theme: ThemeType) => ({
  root: {
    position: 'relative',
  },
  disabled: {
    cursor: 'not-allowed',
  },
  smallArrow: {
    opacity: isEAForum ? 0.7 : 0.6,
    pointerEvents: 'none',
  },
  smallArrowLarge: {
    opacity: isEAForum ? 0.7 : 0.6,
    pointerEvents: 'none',
  },
  up: {
  },
  upLarge: {
  },
  down: {
    transform: 'rotate(-180deg)',
    top: 1
  },
  downLarge: {
    transform: 'rotate(-180deg)',
    top: 1
  },
  right: {
    transform: 'rotate(-270deg)',
  },
  rightLarge: {
    transform: 'rotate(-270deg)',
  },
  left: {
    transform: 'rotate(-90deg)',
  },
  leftLarge: {
    transform: 'rotate(-90deg)',
  },
  bigArrow: {
    height: 10,
    width: 10,
    pointerEvents: 'none',
    position: 'absolute',
    top: '-70%',
    fontSize: '82%',
    opacity: 0,
  },
  bigArrowLarge: {
    height: 14,
    width: 14,
    pointerEvents: 'none',
    position: 'absolute',
    top: '-90%',
    fontSize: '100%',
    opacity: 0,
  },
  bigArrowSolid: {
    top: '-35%',
    transform: 'scale(1.4)',
  },
  bigArrowSolidLarge: {
    top: '-30%',
    transform: 'scale(1.6)',
  },
  bigArrowCompleted: {
    fontSize: '90%',
    top: '-35%',
    opacity: 1
  },
  bigArrowCompletedLarge: {
    fontSize: '110%',
    top: '-35%',
    opacity: 1
  },
  entering: {
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
  }
}));

const VoteArrowIconSolid = ({
  orientation,
  enabled = true,
  color,
  voted,
  eventHandlers,
  bigVotingTransition,
  bigVoted,
  bigVoteCompleted,
  alwaysColored,
  strongVoteDelay,
  largeArrow = false,
}: BaseVoteArrowIconProps) => {
  const classes = useStyles(styles);
  const sharedClasses = useStyles(voteButtonSharedStyles);

  const iconSize = largeArrow ? 14 : 10;

  const Icon = (
    <SoftUpArrowIcon
      style={{
        height: iconSize,
        width: iconSize,
      }}
      className={classNames(
        largeArrow ? classes.smallArrowLarge : classes.smallArrow,
        (voted || alwaysColored) && getVoteButtonColor(sharedClasses, color, "main")
      )}
    />
  );

  const handlers = enabled ? eventHandlers : {};

  const accentIconClasses = largeArrow
    ? classNames(
        bigVotingTransition && classes.entering,
        classes.bigArrowLarge,
        (bigVotingTransition || bigVoteCompleted || bigVoted) && classes.bigArrowCompletedLarge,
        classes.bigArrowSolidLarge
      )
    : classNames(
        bigVotingTransition && classes.entering,
        classes.bigArrow,
        (bigVotingTransition || bigVoteCompleted || bigVoted) && classes.bigArrowCompleted,
        classes.bigArrowSolid
    );

  return (
    <button
      className={classNames(
        classes.root,
        sharedClasses.root,
        classes[orientation],
        largeArrow && classes[`${orientation}Large`],
        !enabled && classes.disabled,
      )}
      type="button"
      onMouseDown={handlers.handleMouseDown}
      onMouseUp={handlers.handleMouseUp}
      onMouseOut={handlers.clearState}
      onClick={handlers.handleClick}
    >
    <span className={sharedClasses.inner}>
      {Icon}
      <SoftUpArrowIconCap
        className={classNames(
          accentIconClasses,
          (bigVoteCompleted || bigVoted) && getVoteButtonColor(sharedClasses, color, "light")
        )}
      />
    </span>
    </button>
  );
};

export default VoteArrowIconSolid;
