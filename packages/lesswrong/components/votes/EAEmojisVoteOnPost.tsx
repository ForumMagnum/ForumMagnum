import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useVote } from "./withVote";
import type { PostVotingComponentProps } from "../../lib/voting/votingSystems";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
  },
  divider: {
    borderLeft: theme.palette.border.grey300,
    margin: "6px 8px 8px 16px",
  },
  reacts: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    fontSize: 16,
    fontWeight: 500,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[600],
    "& svg": {
      width: 14,
      height: 14,
    },
  },
});

interface EAEmojisVoteOnPostProps extends PostVotingComponentProps {
  classes: ClassesType,
}

const EAEmojisVoteOnPost = ({
  document,
  votingSystem,
  isFooter,
  classes,
}: EAEmojisVoteOnPostProps) => {
  const voteProps = useVote(document, "Posts", votingSystem);

  const {PostsVoteDefault, EAReactsSection} = Components;
  if (!isFooter) {
    return (
      <PostsVoteDefault
        post={document}
        votingSystem={votingSystem}
      />
    );
  }

  return (
    <div className={classes.root}>
      <PostsVoteDefault
        post={document}
        votingSystem={votingSystem}
        useHorizontalLayout
      />
      <div className={classes.divider} />
      <div className={classes.reacts}>
        <EAReactsSection
          document={document}
          voteProps={voteProps}
        />
      </div>
    </div>
  );
}

const EAEmojisVoteOnPostComponent = registerComponent(
  "EAEmojisVoteOnPost",
  EAEmojisVoteOnPost,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAEmojisVoteOnPost: typeof EAEmojisVoteOnPostComponent
  }
}
