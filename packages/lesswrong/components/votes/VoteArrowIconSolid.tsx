import React from 'react';
import classNames from 'classnames';
import { SoftUpArrowIcon } from '../icons/softUpArrowIcon';
import { SoftUpArrowIconCap } from '../icons/softUpArrowIconCap';
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
    opacity: theme.isEAForum ? 0.7 : 0.6,
    pointerEvents: 'none',
  },
  smallArrowLarge: {
    opacity: theme.isEAForum ? 0.7 : 0.6,
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
  },
  bigArrowLarge: {
    height: 14,
    width: 14,
    pointerEvents: 'none',
    position: 'absolute',
    top: '-90%',
    fontSize: '100%',
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
  },
  bigArrowCompletedLarge: {
    fontSize: '110%',
    top: '-35%',
  },
}));

const VoteArrowIconSolid = ({
  orientation,
  enabled = true,
  color,
  animation,
  alwaysColored,
  largeArrow = false,
}: BaseVoteArrowIconProps) => {
  const classes = useStyles(styles);
  const { state, eventHandlers } = animation;
  const sharedClasses = useStyles(voteButtonSharedStyles);

  const iconSize = largeArrow ? 14 : 10;
  const voted = state.mode !== "idle" || state.vote !== "neutral";

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
      {...(enabled ? eventHandlers : {})}
    >
    <span className={sharedClasses.inner}>
      <SoftUpArrowIcon
        width={iconSize}
        height={iconSize}
        className={classNames(
          largeArrow ? classes.smallArrowLarge : classes.smallArrow,
          (voted || alwaysColored) && getVoteButtonColor(sharedClasses, color, "main")
        )}
      />
      
      {((state.mode==="idle" && state.vote==="big") || (state.mode !== "idle")) && <SoftUpArrowIconCap
        className={classNames(
          state.mode === "animating" && sharedClasses.entering,
          largeArrow ? classes.bigArrowLarge : classes.bigArrow,
          (state.mode === "completed") && (largeArrow ? classes.bigArrowCompletedLarge : classes.bigArrowCompleted),
          largeArrow ? classes.bigArrowSolidLarge : classes.bigArrowSolid,
          getVoteButtonColor(sharedClasses, color, "light")
        )}
      />}
    </span>
    </button>
  );
};

export default VoteArrowIconSolid;
