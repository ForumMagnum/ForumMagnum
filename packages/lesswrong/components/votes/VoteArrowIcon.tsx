import React from 'react';
import VoteArrowIconSolid from "./VoteArrowIconSolid";
import VoteArrowIconHollow from "./VoteArrowIconHollow";
import { type VoteButtonAnimationHandlers, type VoteColor } from './VoteButton';

export interface BaseVoteArrowIconProps {
  orientation: "up"|"down"|"left"|"right",
  largeArrow?: boolean,
  enabled?: boolean,
  color: VoteColor,
  animation: VoteButtonAnimationHandlers,
  /*voted: boolean,
  eventHandlers: {
    handleMouseDown?: () => void,
    handleMouseUp?: () => void,
    handleClick?: () => void,
    clearState?: () => void,
  },
  bigVotingTransition: boolean,
  bigVoted: boolean,
  bigVoteCompleted: boolean,*/
  alwaysColored: boolean,
}

export interface VoteArrowIconProps extends BaseVoteArrowIconProps {
  solidArrow?: boolean,
}

const VoteArrowIcon = (props: VoteArrowIconProps) => {
  const { solidArrow } = props;
  if (solidArrow) {
    return <VoteArrowIconSolid {...props} />;
  } else {
    return <VoteArrowIconHollow {...props} />;
  }
};

export default VoteArrowIcon;


