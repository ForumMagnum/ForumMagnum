'use client';

import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import type { CommentVotingComponentProps } from '@/lib/voting/votingSystemTypes';
import { useVote } from "./withVote";
import EAReactsSection, { isEAReactableDocument } from "./EAReactsSection";
import OverallVoteAxis from "./OverallVoteAxis";

const styles = (_theme: ThemeType) => ({
  overallAxis: {
    marginRight: 1,
    "&.OverallVoteAxis-overallSection": {
      height: 22,
      "& > *": {
        transform: "translateY(-1px)",
      },
      "& > *:nth-child(2)": {
        transform: "translateY(-2px)",
      },
    },
  },
});

interface EAEmojisVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType<typeof styles>,
}

const EAEmojisVoteOnComment = ({
  document,
  hideKarma = false,
  collectionName,
  votingSystem,
  classes,
}: EAEmojisVoteOnCommentProps) => {
  const voteProps = useVote(
    document,
    collectionName,
    votingSystem,
  );
  return (
    <>
      <OverallVoteAxis
        document={document}
        hideKarma={hideKarma}
        voteProps={voteProps}
        className={classes.overallAxis}
        showBox
      />
      {isEAReactableDocument(collectionName, document) &&
        <EAReactsSection
          document={document}
          voteProps={voteProps}
        />
      }
    </>
  );
}

export default registerComponent(
  "EAEmojisVoteOnComment",
  EAEmojisVoteOnComment,
  {styles},
);


