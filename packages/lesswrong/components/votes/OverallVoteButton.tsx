import React, { useContext } from 'react';
import { useGetCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import { useTracking } from '../../lib/analyticsEvents';
import { recombeeApi } from '../../lib/recombee/client';
import { RecombeeRecommendationsContext } from '../recommendations/RecombeeRecommendationsContextWrapper';
import { recombeeEnabledSetting } from '@/lib/instanceSettings';
import LoginPopup from "../users/LoginPopup";
import { VoteButtonAnimation } from "./VoteButton";
import VoteArrowIcon from "./VoteArrowIcon";

const OverallVoteButton = <T extends VoteableTypeClient>({
  vote, collectionName, document, upOrDown,
  color = "secondary",
  orientation = "up",
  enabled,
  solidArrow,
  largeArrow,
}: {
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
}) => {
  const getCurrentUser = useGetCurrentUser();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const recombeeRecommendationsContext = useContext(RecombeeRecommendationsContext);

  const wrappedVote = (strength: "big"|"small"|"neutral") => {
    const voteType = strength === 'neutral' ? 'neutral' : strength+upOrDown;
    const currentUserId = getCurrentUser()?._id;
    
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

  const currentStrength = (document.currentUserVote === "big"+upOrDown)
    ? "big"
    : (document.currentUserVote === "small"+upOrDown)
      ? "small"
      : "neutral";

  return <VoteButtonAnimation
    vote={wrappedVote}
    currentStrength={currentStrength}
  >
    {animation => <VoteArrowIcon
      animation={animation}
      color={color}
      orientation={orientation}
      solidArrow={solidArrow}
      largeArrow={largeArrow}
      alwaysColored={false}
    />}
  </VoteButtonAnimation>
}

export default OverallVoteButton;


