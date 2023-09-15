import { isEAForum } from "../../lib/instanceSettings";
import { useCurrentUser } from "../common/withUser";
import { VoteColor, cssLightVoteColors, cssMainVoteColors } from "./voteColors";

export const useVoteColors = (color: VoteColor) => {
  const currentUser = useCurrentUser();
  const cssColor = isEAForum && currentUser?.beta && color === "secondary"
    ? "greenUpvote"
    : color;
  const mainColor = cssMainVoteColors[cssColor];
  const lightColor = cssLightVoteColors[cssColor];
  return {mainColor, lightColor};
}
