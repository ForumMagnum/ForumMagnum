import { requireCssVar } from "@/themes/cssVars";

export const wrappedHighlightColor = requireCssVar("palette", "wrapped", "highlightText");
export const wrappedSecondaryColor = requireCssVar("palette", "wrapped", "secondaryText");

/**
 * Formats the percentile as an integer > 0
 */
export const formatPercentile = (percentile: number) =>
  Math.ceil((1 - percentile) * 100) || 1;
