import React from 'react';
import classNames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import Transition from 'react-transition-group/Transition';
import { SoftUpArrowIcon } from '../icons/softUpArrowIcon';
import { SoftUpArrowIconCap } from '../icons/softUpArrowIconCap';
import { useVoteColors } from './useVoteColors';
import { registerComponent } from '@/lib/vulcan-lib';
import { isEAForum } from '../../lib/instanceSettings';
import { isFriendlyUI } from '@/themes/forumTheme';
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
  },
  smallArrowLarge: {
    opacity: isEAForum ? 0.7 : 0.6,
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
    position: 'absolute',
    top: '-70%',
    fontSize: '82%',
    opacity: 0,
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
  },
  bigArrowLarge: {
    position: 'absolute',
    top: '-90%',
    fontSize: '100%',
    opacity: 0,
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
  },
  bigArrowSolid: isFriendlyUI
    ? {
        fontSize: '65%',
        top: '-45%',
      }
    : {
        top: '-35%',
        transform: 'scale(1.4)',
      },
  bigArrowSolidLarge: isFriendlyUI
    ? {
        fontSize: '85%',
        top: '-60%',
      }
    : {
        top: '-30%',
        transform: 'scale(1.6)',
      },
  bigArrowCompleted: {
    fontSize: '90%',
    top: '-75%',
  },
  bigArrowCompletedLarge: {
    fontSize: '110%',
    top: '-95%',
  },
  entering: {
    opacity: 1,
  },
  entered: {
    opacity: 1,
  },
  exiting: {
    transition: 'opacity 150ms cubic-bezier(0.74, -0.01, 1, 1) 0ms',
  },
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

  const getTransitionIcon = (state: string) => (
    <SoftUpArrowIconCap
      style={
        bigVoteCompleted || bigVoted
          ? { color: lightColor, height: iconSize, width: iconSize }
          : { height: iconSize, width: iconSize }
      }
      className={classNames(
        largeArrow ? classes.bigArrowLarge : classes.bigArrow,
        bigVoteCompleted &&
          (largeArrow ? classes.bigArrowCompletedLarge : classes.bigArrowCompleted),
        isFriendlyUI
          ? largeArrow
            ? classes.bigArrowSolidLarge
            : classes.bigArrowSolid
          : largeArrow
          ? classes.bigArrowSolidLarge
          : classes.bigArrowSolid,
        classes[state]
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
      <Transition in={!!(bigVotingTransition || bigVoted)} timeout={strongVoteDelay}>
        {(state) => getTransitionIcon(state)}
      </Transition>
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

