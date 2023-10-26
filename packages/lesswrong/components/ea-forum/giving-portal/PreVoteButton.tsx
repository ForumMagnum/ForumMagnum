import React, { useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import type { VoteCallback } from "../../votes/votingProps";

const styles = (theme: ThemeType) => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.givingPortal[0],
    fontSize: 20,
    "&:hover": {
      opacity: 0.5,
    },
  },
});

const PreVoteButton = ({vote, className, classes}: {
  vote: VoteCallback<ElectionCandidateBasicInfo>,
  className?: string,
  classes: ClassesType,
}) => {
  const onVote = useCallback(() => {
    // TODO
  }, [vote]);

  const {LWTooltip, ForumIcon} = Components;
  return (
    <LWTooltip
      title="Pre-vote"
      placement="bottom"
      className={className}
    >
      <ForumIcon
        onClick={onVote}
        icon="HeartOutline"
        className={classes.icon}
      />
    </LWTooltip>
  );
}

const PreVoteButtonComponent = registerComponent(
  "PreVoteButton",
  PreVoteButton,
  {styles},
);

declare global {
  interface ComponentTypes {
    PreVoteButton: typeof PreVoteButtonComponent;
  }
}
