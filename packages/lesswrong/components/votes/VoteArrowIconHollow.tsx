import React, { useRef } from 'react';
import classNames from 'classnames';
import UpArrowIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowUp';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import Transition from 'react-transition-group/Transition';
import { isEAForum } from '../../lib/instanceSettings';
import type { VoteArrowIconProps } from './VoteArrowIcon';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getVoteButtonColor, voteButtonSharedStyles } from './VoteButton';

const styles = defineStyles("VoteArrowIconHollow", (theme: ThemeType) => ({
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
    </IconButton>
  );
};

export default VoteArrowIconHollow;


