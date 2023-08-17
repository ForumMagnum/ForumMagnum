import { requireCssVar } from '../../themes/cssVars';

const voteColors = ["error", "primary", "secondary"] as const;

export type VoteColor = typeof voteColors[number];

export const cssVoteColors = Object.fromEntries(
  voteColors.map((color) => [color, requireCssVar("palette", color, "light")]),
);
