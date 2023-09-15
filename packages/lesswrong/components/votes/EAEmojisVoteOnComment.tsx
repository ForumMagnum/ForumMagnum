import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CommentVotingComponentProps } from "../../lib/voting/votingSystems";
import { useVote } from "./withVote";
import { isEAReactableDocument } from "./EAReactsSection";

const styles = (_theme: ThemeType): JssStyles => ({
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
  classes: ClassesType,
}

const EAEmojisVoteOnComment = ({
  document,
  hideKarma = false,
  collection,
  votingSystem,
  classes,
}: EAEmojisVoteOnCommentProps) => {
  const voteProps = useVote(
    document,
    collection.options.collectionName,
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
      {isEAReactableDocument(collection, document) &&
        <EAReactsSection
          document={document}
          voteProps={voteProps}
        />
      }
    </>
  );
}

const EAEmojisVoteOnCommentComponent = registerComponent(
  "EAEmojisVoteOnComment",
  EAEmojisVoteOnComment,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAEmojisVoteOnComment: typeof EAEmojisVoteOnCommentComponent
  }
}
