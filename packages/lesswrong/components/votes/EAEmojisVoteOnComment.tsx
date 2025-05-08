import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { CommentVotingComponentProps } from "../../lib/voting/votingSystems";
import { useVote } from "./withVote";
import { isEAReactableDocument } from "./EAReactsSection";

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

const EAEmojisVoteOnCommentInner = ({
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
  const {OverallVoteAxis, EAReactsSection} = Components;
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

export const EAEmojisVoteOnComment = registerComponent(
  "EAEmojisVoteOnComment",
  EAEmojisVoteOnCommentInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAEmojisVoteOnComment: typeof EAEmojisVoteOnComment
  }
}
