import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import { useTracking } from '../../lib/analyticsEvents';

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
}

const OverallVoteButton = <T extends VoteableTypeClient>({
  vote, collectionName, document, upOrDown,
  color = "secondary",
  orientation = "up",
  enabled,
  solidArrow,
}: OverallVoteButtonProps<T>) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();

  const wrappedVote = (strength: "big"|"small"|"neutral") => {
    const voteType = strength+upOrDown;
    if(!currentUser){
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    } else {
      if (strength === "neutral") {
        vote?.({document, voteType: "neutral", extendedVote: document?.currentUserExtendedVote, currentUser});
      } else {
        vote?.({document, voteType: voteType, extendedVote: document?.currentUserExtendedVote, currentUser});
      }
      captureEvent("vote", {collectionName});
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
    enabled={enabled}
  />
}

const OverallVoteButtonComponent = registerComponent('OverallVoteButton', OverallVoteButton);

declare global {
  interface ComponentTypes {
    OverallVoteButton: typeof OverallVoteButtonComponent
  }
}
