import React from 'react';
import classNames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import { SoftUpArrowIcon } from '../icons/softUpArrowIcon';
import { SoftUpArrowIconCap } from '../icons/softUpArrowIconCap';
import { useVoteColors } from './useVoteColors';
import { registerComponent } from '@/lib/vulcan-lib';
import { isEAForum } from '../../lib/instanceSettings';
import type { BaseVoteArrowIconProps } from './VoteArrowIcon';

const styles = (theme: ThemeType): JssStyles => ({
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
    pointerEvents: 'none',
    position: 'absolute',
    top: '-70%',
    fontSize: '82%',
    opacity: 0,
  },
  bigArrowLarge: {
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
  classes: ClassesType
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
      className={classNames(
        largeArrow ? classes.smallArrowLarge : classes.smallArrow
      )}
    />
  );

  const handlers = enabled ? eventHandlers : {};

  return (
    <IconButton
      className={classNames(
        classes.root,
        classes[orientation],
        largeArrow && classes[`${orientation}Large`],
        !enabled && classes.disabled
      )}
      onMouseDown={handlers.handleMouseDown}
      onMouseUp={handlers.handleMouseUp}
      onMouseOut={handlers.clearState}
      onClick={handlers.handleClick}
      disableRipple
    >
      {Icon}
      <SoftUpArrowIconCap
        style={
          bigVoteCompleted || bigVoted
            ? { color: lightColor, height: iconSize, width: iconSize }
            : { height: iconSize, width: iconSize }
        }
        className={classNames(
          bigVotingTransition && classes.entering,
          largeArrow ? classes.bigArrowLarge : classes.bigArrow,
          (bigVotingTransition || bigVoteCompleted || bigVoted) &&
            (largeArrow ? classes.bigArrowCompletedLarge : classes.bigArrowCompleted),
          largeArrow
              ? classes.bigArrowSolidLarge
              : classes.bigArrowSolid
        )}
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

