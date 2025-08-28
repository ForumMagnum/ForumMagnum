import React from 'react';
import classNames from 'classnames';
import { isEAForum } from '../../lib/instanceSettings';
import type { VoteArrowIconProps } from './VoteArrowIcon';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getVoteButtonColor, voteButtonSharedStyles } from './VoteButton';
import { strongVoteDelay } from './constants';

const styles = defineStyles("VoteArrowIconHollow", (theme: ThemeType) => ({
  disabled: {
    cursor: 'not-allowed',
  },
  smallArrow: {
    fontSize: '50%',
    opacity: isEAForum ? 0.7 : 0.6,
    width: "1em",
    height: "1em",
    fill: "currentColor",
    pointerEvents: 'none',
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
    pointerEvents: 'none',
    //opacity: 0,
    //transition: `opacity ${strongVoteDelay}ms cubic-bezier(0.74, -0.01, 1, 1) 0ms`,

    width: '1em',
    height: '1em',
    fill: "currentColor",
  },
  bigArrowCompleted: {
    fontSize: '90%',
    top: '-75%',
    opacity: 1.0,
  },
}));

const UpArrowIcon = ({className}: {className: string}) =>
  <svg
    className={className}
    viewBox="6 6 12 12"
  >
    <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
    <path fill="none" d="M0 0h24v24H0z" />
  </svg>


const VoteArrowIconHollow = ({
  orientation,
  enabled = true,
  color,
  animation,
  alwaysColored,
}: VoteArrowIconProps) => {
  const classes = useStyles(styles);
  const { state, eventHandlers } = animation;
  const sharedClasses = useStyles(voteButtonSharedStyles);
  const voted = state.mode !== "idle" || state.vote !== "neutral";

  return (
    <button
      className={classNames(
        sharedClasses.root,
        classes[orientation],
        !enabled && classes.disabled,
      )}
      type="button"
      {...(enabled ? eventHandlers : {})}
    >
      <span className={sharedClasses.inner}>
        <UpArrowIcon
          className={classNames(
            classes.smallArrow,
            (voted || alwaysColored) && getVoteButtonColor(sharedClasses, color, "main")
          )}
        />
        {((state.mode==="idle" && state.vote==="big") || (state.mode !== "idle")) &&
          <UpArrowIcon
            className={classNames(
              state.mode === "animating" && sharedClasses.entering,
              classes.bigArrow,
              (state.mode === "completed") && classes.bigArrowCompleted,
              getVoteButtonColor(sharedClasses, color, "light")
            )}
          />
        }
      </span>
    </button>
  );
};

export default VoteArrowIconHollow;


