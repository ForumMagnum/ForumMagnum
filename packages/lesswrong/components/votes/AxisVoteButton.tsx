import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import { useTracking } from '../../lib/analyticsEvents';
import type { VoteArrowIconProps } from '../votes/VoteArrowIcon';
import LoginPopup from "../users/LoginPopup";
import VoteButton from "./VoteButton";

const AxisVoteButton = <T extends VoteableTypeClient>({VoteIconComponent, vote, document, axis, upOrDown, color, orientation, enabled, collectionName}: {
  VoteIconComponent: React.ComponentType<VoteArrowIconProps>,
  vote: (props: {document: T, voteType: string|null, extendedVote?: any, currentUser: UsersCurrent}) => void,
  document: T,
  axis: string,
  upOrDown: "Upvote"|"Downvote",
  color: "error"|"primary"|"secondary",
  orientation: "up"|"down"|"left"|"right",
  enabled: boolean,
  collectionName?: CollectionNameString,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();

  const wrappedVote = (strength: "big"|"small"|"neutral") => {
    if(!currentUser){
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose}/>
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
      
      // Track axis votes (like agreement votes)
      captureEvent("axisVote", {
        axis,
        ...(collectionName && { collectionName }),
      });
    }
  };
  
  const currentVoteOnAxis = document.currentUserExtendedVote?.[axis] || "neutral";
  const currentStrength = (currentVoteOnAxis === "small"+upOrDown) ? "small" : (currentVoteOnAxis === "big"+upOrDown) ? "big" : "neutral";
  
  return <VoteButton
    VoteIconComponent={VoteIconComponent}
    vote={wrappedVote}
    currentStrength={currentStrength}
    
    upOrDown={upOrDown}
    color={color}
    orientation={orientation}
    enabled={enabled}
  />
}

export default registerComponent('AxisVoteButton', AxisVoteButton);


