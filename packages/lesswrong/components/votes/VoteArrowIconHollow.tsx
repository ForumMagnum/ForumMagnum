import React, { useRef } from 'react';
import classNames from 'classnames';
import UpArrowIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowUp';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import Transition from 'react-transition-group/Transition';
import { useVoteColors } from './useVoteColors';
import { registerComponent } from '@/lib/vulcan-lib/components.tsx';
import { isEAForum } from '../../lib/instanceSettings';
import type { VoteArrowIconProps } from './VoteArrowIcon';

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[400],
    fontSize: 'inherit',
    width: 'initial',
    height: 'initial',
    padding: 0,
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
  disabled: {
    cursor: 'not-allowed',
  },
  smallArrow: {
    fontSize: '50%',
    opacity: isEAForum ? 0.7 : 0.6,
  },
  up: {
  },
  right: {
    transform: 'rotate(-270deg)',
  },
  down: {
    transform: 'rotate(-180deg)',
  },
  left: {
    transform: 'rotate(-90deg)',
  },
  bigArrow: {
    position: 'absolute',
    top: '-70%',
    fontSize: '82%',
    opacity: 0,
    transition: `opacity ${theme.voting.strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,
  },
  bigArrowCompleted: {
    fontSize: '90%',
    top: '-75%',
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

const VoteArrowIconHollow = ({
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
  classes,
}: VoteArrowIconProps & {
  classes: ClassesType<typeof styles>
}) => {
  const { mainColor, lightColor } = useVoteColors(color);
  const handlers = enabled ? eventHandlers : {};
  const nodeRef = useRef<SVGSVGElement|null>(null);

  return (
    <IconButton
      className={classNames(
        classes.root,
        classes[orientation],
        !enabled && classes.disabled
      )}
      onMouseDown={handlers.handleMouseDown}
      onMouseUp={handlers.handleMouseUp}
      onMouseOut={handlers.clearState}
      onClick={handlers.handleClick}
      disableRipple
    >
      <UpArrowIcon
        style={{ color: voted || alwaysColored ? mainColor : 'inherit' }}
        className={classNames(classes.smallArrow)}
        viewBox="6 6 12 12"
      />
      <Transition in={!!(bigVotingTransition || bigVoted)} timeout={strongVoteDelay} nodeRef={nodeRef as any}>
        {(state) => (
          <UpArrowIcon
            style={bigVoteCompleted || bigVoted ? { color: lightColor } : undefined}
            nodeRef={nodeRef}
            className={classNames(
              classes.bigArrow,
              bigVoteCompleted && classes.bigArrowCompleted,
              (classes as AnyBecauseTodo)[state]
            )}
            viewBox="6 6 12 12"
        />)}
      </Transition>
    </IconButton>
  );
};

const VoteArrowIconHollowComponent = registerComponent(
  'VoteArrowIconHollow',
  VoteArrowIconHollow,
  { styles }
);

declare global {
  interface ComponentTypes {
    VoteArrowIconHollow: typeof VoteArrowIconHollowComponent;
  }
}
