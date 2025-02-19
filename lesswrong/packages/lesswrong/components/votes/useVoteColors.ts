import { VoteColor, cssLightVoteColors, cssMainVoteColors } from "./voteColors";

export const useVoteColors = (color: VoteColor) => {
  const mainColor = cssMainVoteColors[color];
  const lightColor = cssLightVoteColors[color];
  return {mainColor, lightColor};
}
