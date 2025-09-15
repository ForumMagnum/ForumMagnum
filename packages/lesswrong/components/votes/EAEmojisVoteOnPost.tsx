import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useVote } from "./withVote";
import type { PostVotingComponentProps } from "../../lib/voting/votingSystems";
import classNames from "classnames";
import PostsVoteDefault from "./PostsVoteDefault";
import EAReactsSection from "./EAReactsSection";

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
    gap: "6px",
    fontSize: 16,
    fontWeight: 500,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[600],
    "& svg": {
      width: "auto",
      height: 16,
    },
  },
  // On small screens reactions are displayed by EAEmojisVoteOnPostSecondary
  hideOnMobile: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
});

interface EAEmojisVoteOnPostProps extends PostVotingComponentProps {
  classes: ClassesType<typeof styles>,
}

const EAEmojisVoteOnPost = ({
  document,
  votingSystem,
  isFooter,
  classes,
}: EAEmojisVoteOnPostProps) => {
  const voteProps = useVote(document, "Posts", votingSystem);
  if (!isFooter) {
    return (
      <PostsVoteDefault
        post={document}
        votingSystem={votingSystem}
        useHorizontalLayout
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
      <div className={classNames(classes.divider, classes.hideOnMobile)} />
      <div className={classNames(classes.reacts, classes.hideOnMobile)}>
        <EAReactsSection
          document={document}
          voteProps={voteProps}
          large
        />
      </div>
    </div>
  );
}

export default registerComponent(
  "EAEmojisVoteOnPost",
  EAEmojisVoteOnPost,
  {styles},
);


