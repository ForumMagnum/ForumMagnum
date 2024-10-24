import React, { useContext } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import { useTracking } from '../../lib/analyticsEvents';
import { recombeeApi } from '../../lib/recombee/client';
import { RecombeeRecommendationsContext } from '../recommendations/RecombeeRecommendationsContextWrapper';
import { recombeeEnabledSetting } from '../../lib/publicSettings';

export interface OverallVoteButtonProps<T extends VoteableTypeClient> {
  vote?: (props: {
    document: T,
    voteType: string|null,
    extendedVote?: any,
    currentUser: UsersCurrent,
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
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const recombeeRecommendationsContext = useContext(RecombeeRecommendationsContext);

  const wrappedVote = (strength: "big"|"small"|"neutral") => {
    const voteType = strength === 'neutral' ? 'neutral' : strength+upOrDown;
    
    if(!currentUser){
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    } else {
      vote?.({document, voteType: voteType, extendedVote: document?.currentUserExtendedVote, currentUser});
      captureEvent("vote", {collectionName});
      if (recombeeEnabledSetting.get() && collectionName === "Posts" && recombeeRecommendationsContext?.postId === document._id) {
        void recombeeApi.createRating(document._id, currentUser._id, voteType, recombeeRecommendationsContext.recommId);
      }
    }
  }

  return <Components.VoteButton
    VoteIconComponent={Components.VoteArrowIcon}
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

const OverallVoteButtonComponent = registerComponent('OverallVoteButton', OverallVoteButton);

declare global {
  interface ComponentTypes {
    OverallVoteButton: typeof OverallVoteButtonComponent
  }
}
