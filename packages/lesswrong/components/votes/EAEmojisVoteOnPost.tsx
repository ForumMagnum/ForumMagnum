import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import type { PostVotingComponentProps } from "../../lib/voting/votingSystems";

const styles = (_theme: ThemeType) => ({
});

interface EAEmojisVoteOnPostProps extends PostVotingComponentProps {
  classes: ClassesType,
}

const EAEmojisVoteOnPost = ({
  document,
  votingSystem,
  classes,
}: EAEmojisVoteOnPostProps) => {
  const {PostsVoteDefault} = Components;
  return (
    <div>
      <PostsVoteDefault
        post={document}
        useHorizontalLayout
      />
      <div>Custom</div>
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
