import React from 'react';
import classNames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import { SoftUpArrowIcon } from '../icons/softUpArrowIcon';
import { SoftUpArrowIconCap } from '../icons/softUpArrowIconCap';
import { useVoteColors } from './useVoteColors';
import { registerComponent } from '@/lib/vulcan-lib';
import { isEAForum } from '../../lib/instanceSettings';
import type { BaseVoteArrowIconProps } from './VoteArrowIcon';

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[400],
    fontSize: 'inherit',
    width: 'initial',
    height: 'initial',
    padding: 0,
    position: 'relative',
    '&:hover': {
      backgroundColor: 'transparent',
    },
    marginLeft: isEAForum ? 0 : 1,
    marginRight: isEAForum ? 0 : 1,
    transition: 'transform 0.2s ease-in-out',
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
  upAnimationCompleted: {
    transform: 'translateY(2px)',
  },
  down: {
    transform: 'rotate(-180deg)',
    top: 1
  },
  downAnimationCompleted: {
    transform: 'rotate(-180deg) translateY(2px)',
  },
  right: {
    transform: 'rotate(-270deg)',
  },
  rightAnimationCompleted: {
    transform: 'rotate(-270deg) translateY(2px)',
  },
  left: {
    transform: 'rotate(-90deg)',
  },
  leftAnimationCompleted: {
    transform: 'rotate(-90deg) translateY(2px)',
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
});

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
  classes,
}: BaseVoteArrowIconProps & {
  classes: ClassesType<typeof styles>
}) => {

  const { mainColor, lightColor } = useVoteColors(color);

  const iconSize = largeArrow ? 14 : 10;

  const Icon = (
    <SoftUpArrowIcon
      style={{
        color: voted || alwaysColored ? mainColor : 'inherit',
        height: iconSize,
        width: iconSize,
      }}
      className={classNames(largeArrow ? classes.smallArrowLarge : classes.smallArrow)}
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
    <IconButton
      className={classNames(
        classes.root,
        classes[orientation],
        !enabled && classes.disabled,
        bigVoted && !isEAForum && classes[`${orientation}AnimationCompleted`]
      )}
      onMouseDown={handlers.handleMouseDown}
      onMouseUp={handlers.handleMouseUp}
      onMouseOut={handlers.clearState}
      onClick={handlers.handleClick}
      disableRipple
    >
      {Icon}
      <SoftUpArrowIconCap
        style={bigVoteCompleted || bigVoted ? { color: lightColor } : {}}
        className={accentIconClasses}
      />
    </IconButton>
  );
};

const VoteArrowIconSolidComponent = registerComponent( 'VoteArrowIconSolid', VoteArrowIconSolid, {styles});

export default VoteArrowIconSolidComponent;

declare global {
  interface ComponentTypes {
    VoteArrowIconSolid: typeof VoteArrowIconSolidComponent;
  }
}

