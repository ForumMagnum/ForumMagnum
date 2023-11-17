import { requireCssVar } from '../../themes/cssVars';

const voteColors = ["error", "primary", "secondary"] as const;

export type VoteColor = typeof voteColors[number];

export const cssMainVoteColors = Object.fromEntries(
  voteColors.map((color) => [color, requireCssVar("palette", color, "main")]),
) as Record<VoteColor, string>;

export const cssLightVoteColors = Object.fromEntries(
  voteColors.map((color) => [color, requireCssVar("palette", color, "light")]),
) as Record<VoteColor, string>;
