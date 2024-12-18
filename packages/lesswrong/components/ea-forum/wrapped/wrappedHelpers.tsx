import { requireCssVar } from "@/themes/cssVars";
import { userGetProfileUrlFromSlug } from "@/lib/collections/users/helpers";
import type { WrappedYear } from "./hooks";

export const wrappedWhiteColor = requireCssVar("palette", "text", "alwaysWhite");
export const wrappedHighlightColor = requireCssVar("palette", "wrapped", "highlightText");
export const wrappedSecondaryColor = requireCssVar("palette", "wrapped", "secondaryText");

/**
 * Formats the percentile as an integer > 0
 */
export const formatPercentile = (percentile: number) =>
  Math.ceil((1 - percentile) * 100) || 1;

/**
 * Adds tracking to the user profile link
 */
export const getUserProfileLink = (slug: string, year: WrappedYear) =>
  `${userGetProfileUrlFromSlug(slug)}?from=${year}_wrapped`;

/**
 * Formats the karma change number as a string with a + or -
 */
export const formattedKarmaChangeText = (karmaChange: number) =>
  `${karmaChange >= 0 ? '+' : ''}${karmaChange}`;
