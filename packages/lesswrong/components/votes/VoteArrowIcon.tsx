import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import VoteArrowIconSolid from "./VoteArrowIconSolid";
import VoteArrowIconHollow from "./VoteArrowIconHollow";
import { VoteColor } from './VoteButton';

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

export default registerComponent('VoteArrowIcon', VoteArrowIcon);


