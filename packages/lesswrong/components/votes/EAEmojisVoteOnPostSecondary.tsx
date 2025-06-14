'use client';

import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useVote } from "./withVote";
import type { PostVotingComponentProps } from "../../lib/voting/votingSystems";
import SectionTitle from "../common/SectionTitle";
import EAReactsSection from "./EAReactsSection";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: -15,
    marginBottom: 40,
    // On large screens reactions are displayed by the EAEmojisVoteOnPost component
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  divider: {
    borderTop: theme.palette.border.grey300,
  },
  heading: {
    marginBottom: 4,
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

interface EAEmojisVoteOnPostSecondaryProps extends PostVotingComponentProps {
  classes: ClassesType<typeof styles>,
}

const EAEmojisVoteOnPostSecondary = ({
  document,
  votingSystem,
  classes,
}: EAEmojisVoteOnPostSecondaryProps) => {
  const voteProps = useVote(document, "Posts", votingSystem);
  return (
    <div className={classes.root}>
      <div className={classes.divider} />
      <SectionTitle title="Reactions" titleClassName={classes.heading} />
      <div className={classes.reacts}>
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
  "EAEmojisVoteOnPostSecondary",
  EAEmojisVoteOnPostSecondary,
  {styles},
);


