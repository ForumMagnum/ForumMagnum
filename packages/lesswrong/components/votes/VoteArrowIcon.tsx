import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { VoteColor } from './voteColors';

export interface BaseVoteArrowIconProps {
  strongVoteDelay: number,
  orientation: "up"|"down"|"left"|"right",
  largeArrow?: boolean,
  enabled?: boolean,
  color: VoteColor,
  voted: boolean,
  eventHandlers: {
    handleMouseDown?: () => void,
    handleMouseUp?: () => void,
    handleClick?: () => void,
    clearState?: () => void,
  },
  bigVotingTransition: boolean,
  bigVoted: boolean,
  bigVoteCompleted: boolean,
  alwaysColored: boolean,
}

export interface VoteArrowIconProps extends BaseVoteArrowIconProps {
  solidArrow?: boolean,
}

const VoteArrowIconInner = (props: VoteArrowIconProps) => {
  const { solidArrow } = props;

  const { VoteArrowIconSolid, VoteArrowIconHollow } = Components;

  if (solidArrow) {
    return <VoteArrowIconSolid {...props} />;
  } else {
    return <VoteArrowIconHollow {...props} />;
  }
};

export const VoteArrowIcon = registerComponent('VoteArrowIcon', VoteArrowIconInner);

declare global {
  interface ComponentTypes {
    VoteArrowIcon: typeof VoteArrowIcon;
  }
}
