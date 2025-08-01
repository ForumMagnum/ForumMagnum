import { userGetProfileUrlFromSlug } from "@/lib/collections/users/helpers";
import type { WrappedDataByYear, WrappedYear } from "./hooks";

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

export const getTotalReactsReceived = (data: WrappedDataByYear) =>
  data.mostReceivedReacts.reduce((prev, next) => prev + next.count, 0);

export const getTopAuthor = (data: WrappedDataByYear) => {
  const topAuthorByEngagementPercentile = [...data.mostReadAuthors].sort(
    (a, b) => b.engagementPercentile - a.engagementPercentile,
  )[0];
  const topAuthorPercentByEngagementPercentile = (
    topAuthorByEngagementPercentile &&
    Math.ceil(100 * (1 - topAuthorByEngagementPercentile.engagementPercentile))
  ) || 1;
  return {
    topAuthorByEngagementPercentile,
    topAuthorPercentByEngagementPercentile,
  };
}
