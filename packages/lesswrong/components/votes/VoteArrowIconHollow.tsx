import React, { useRef } from 'react';
import classNames from 'classnames';
import UpArrowIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowUp';
import Transition from 'react-transition-group/Transition';
import type { VoteArrowIconProps } from './VoteArrowIcon';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getVoteButtonColor, voteButtonSharedStyles } from './VoteButton';

const styles = defineStyles("VoteArrowIconHollow", (theme: ThemeType) => ({
  disabled: {
    cursor: 'not-allowed',
  },
  smallArrow: {
    fontSize: '50%',
    opacity: theme.isEAForum ? 0.7 : 0.6,
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
}));

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
}: VoteArrowIconProps) => {
  const classes = useStyles(styles);
  const sharedClasses = useStyles(voteButtonSharedStyles);
  const handlers = enabled ? eventHandlers : {};
  const nodeRef = useRef<SVGSVGElement|null>(null);

  return (
    <button
      className={classNames(
        sharedClasses.root,
        classes[orientation],
        !enabled && classes.disabled,
      )}
      type="button"
      onMouseDown={handlers.handleMouseDown}
      onMouseUp={handlers.handleMouseUp}
      onMouseOut={handlers.clearState}
      onClick={handlers.handleClick}
    >
    <span className={sharedClasses.inner}>
      <UpArrowIcon
        className={classNames(classes.smallArrow, (voted || alwaysColored) && getVoteButtonColor(sharedClasses, color, "main"))}
        viewBox="6 6 12 12"
      />
      <Transition in={!!(bigVotingTransition || bigVoted)} timeout={strongVoteDelay} nodeRef={nodeRef as any}>
        {(state) => (
          <UpArrowIcon
            nodeRef={nodeRef}
            className={classNames(
              classes.bigArrow,
              bigVoteCompleted && classes.bigArrowCompleted,
              (classes as AnyBecauseTodo)[state],
              getVoteButtonColor(sharedClasses, color, "light")
            )}
            viewBox="6 6 12 12"
        />)}
      </Transition>
    </span>
    </button>
  );
};

export default VoteArrowIconHollow;


