import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { VoteColor } from './voteColors';
import { VoteArrowIconSolid } from "@/components/votes/VoteArrowIconSolid";
import VoteArrowIconHollow from "@/components/votes/VoteArrowIconHollow";

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

const VoteArrowIcon = (props: VoteArrowIconProps) => {
  const { solidArrow } = props;
  if (solidArrow) {
    return <VoteArrowIconSolid {...props} />;
  } else {
    return <VoteArrowIconHollow {...props} />;
  }
};

const VoteArrowIconComponent = registerComponent('VoteArrowIcon', VoteArrowIcon);

declare global {
  interface ComponentTypes {
    VoteArrowIcon: typeof VoteArrowIconComponent;
  }
}

export default VoteArrowIconComponent;
