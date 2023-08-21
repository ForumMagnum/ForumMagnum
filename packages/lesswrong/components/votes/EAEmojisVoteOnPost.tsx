import type { PostVotingComponentProps } from "../../lib/voting/votingSystems";
import { registerComponent } from "../../lib/vulcan-lib";

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
  return (
    null
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
