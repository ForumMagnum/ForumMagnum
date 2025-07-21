import React, { useContext } from 'react';
import { useCurrentUserId } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import { useTracking } from '../../lib/analyticsEvents';
import { recombeeApi } from '../../lib/recombee/client';
import { RecombeeRecommendationsContext } from '../recommendations/RecombeeRecommendationsContextWrapper';
import { recombeeEnabledSetting } from '@/lib/instanceSettings';
import LoginPopup from "../users/LoginPopup";
import VoteButton from "./VoteButton";
import VoteArrowIcon from "./VoteArrowIcon";

export interface OverallVoteButtonProps<T extends VoteableTypeClient> {
  vote?: (props: {
    document: T,
    voteType: string|null,
    extendedVote?: any,
  }) => void,
  collectionName: CollectionNameString,
  document: T,
  upOrDown: "Upvote"|"Downvote",
  color: "error"|"primary"|"secondary",
  orientation: "up"|"down"|"left"|"right",
  enabled: boolean,
  solidArrow?: boolean,
  largeArrow?: boolean
}

const OverallVoteButton = <T extends VoteableTypeClient>({
  vote, collectionName, document, upOrDown,
  color = "secondary",
  orientation = "up",
  enabled,
  solidArrow,
  largeArrow,
}: OverallVoteButtonProps<T>) => {
  const currentUserId = useCurrentUserId();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const recombeeRecommendationsContext = useContext(RecombeeRecommendationsContext);

  const wrappedVote = (strength: "big"|"small"|"neutral") => {
    const voteType = strength === 'neutral' ? 'neutral' : strength+upOrDown;
    
    if(!currentUserId){
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose}/>
      });
    } else {
      vote?.({document, voteType: voteType, extendedVote: document?.currentUserExtendedVote});
      captureEvent("vote", {collectionName});
      if (recombeeEnabledSetting.get() && collectionName === "Posts" && recombeeRecommendationsContext?.postId === document._id) {
        void recombeeApi.createRating(document._id, currentUserId, voteType, recombeeRecommendationsContext.recommId);
      }
    }
  }

  return <VoteButton
    VoteIconComponent={VoteArrowIcon}
    vote={wrappedVote}
    currentStrength={
      (document.currentUserVote === "big"+upOrDown)
        ? "big"
        : (
        (document.currentUserVote === "small"+upOrDown)
          ? "small"
          : "neutral"
      )
    }
    upOrDown={upOrDown}
    color={color}
    orientation={orientation}
    solidArrow={solidArrow}
    largeArrow={largeArrow}
    enabled={enabled}
  />
}

export default OverallVoteButton;


