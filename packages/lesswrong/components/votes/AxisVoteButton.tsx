import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import type { VoteArrowIconProps } from '../votes/VoteArrowIcon';

const AxisVoteButtonInner = <T extends VoteableTypeClient>({VoteIconComponent, vote, document, axis, upOrDown, color, orientation, enabled}: {
  VoteIconComponent: React.ComponentType<VoteArrowIconProps>,
  vote: (props: {document: T, voteType: string|null, extendedVote?: any, currentUser: UsersCurrent}) => void,
  document: T,
  axis: string,
  upOrDown: "Upvote"|"Downvote",
  color: "error"|"primary"|"secondary",
  orientation: "up"|"down"|"left"|"right",
  enabled: boolean,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();

  const wrappedVote = (strength: "big"|"small"|"neutral") => {
    if(!currentUser){
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <Components.LoginPopup onClose={onClose}/>
      });
    } else {
      vote({
        document,
        voteType: document.currentUserVote || 'neutral',
        extendedVote: {
          ...document.currentUserExtendedVote,
          [axis]: (strength==="neutral") ? "neutral" : (strength+upOrDown),
        },
        currentUser,
      });
    }
  };
  
  const currentVoteOnAxis = document.currentUserExtendedVote?.[axis] || "neutral";
  const currentStrength = (currentVoteOnAxis === "small"+upOrDown) ? "small" : (currentVoteOnAxis === "big"+upOrDown) ? "big" : "neutral";
  
  return <Components.VoteButton
    VoteIconComponent={VoteIconComponent}
    vote={wrappedVote}
    currentStrength={currentStrength}
    
    upOrDown={upOrDown}
    color={color}
    orientation={orientation}
    enabled={enabled}
  />
}

export const AxisVoteButton = registerComponent('AxisVoteButton', AxisVoteButtonInner);

declare global {
  interface ComponentTypes {
    AxisVoteButton: typeof AxisVoteButton
  }
}
