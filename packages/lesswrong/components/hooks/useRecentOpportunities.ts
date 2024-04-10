import moment from "moment";
import { useTimezone } from "../common/withTimezone";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";
import difference from "lodash/difference";
import groupBy from "lodash/groupBy";

const requiredTags: string[] = [
  "z8qFsGt5iXyZiLbjN", // Opportunities to take action
];

const defaultSubscribedTags: string[] = [
  "fCcrMpyRbozMfwYPF", // Application announcements
  "be4pBryMKxLhkmgvE", // Funding opportunities
  "2BvgFyR85zX25osTT", // Fellowships and internships
  "54Ls7K7N53kYws9ja", // Job listing (open)
  "vgT4Fiybt4qjHLoBv", // Bounty (open)
  "ihpwNfh2ZxR4ZHaAK", // Prizes and contests
];

type KeyWithSubfield<T, S extends string> = {
  [K in keyof T]: S extends keyof T[K] ? K : never
}[keyof T];

export const useRecentOpportunities =<
  FragmentTypeName extends KeyWithSubfield<FragmentTypes, "tagRelevance">
> ({
  fragmentName,
  limit = 3,
  maxAgeInDays = 7,
  post,
}: {
  fragmentName: FragmentTypeName,
  limit?: number,
  maxAgeInDays?: number,
  post?: PostsWithNavigation | PostsWithNavigationAndRevision | PostsList,
}): UseMultiResult<FragmentTypeName> & {coreTagLabel: string | null} => {
  const coreTags =
    post?.tags
      ?.filter((tag) => tag.core && !requiredTags.includes(tag._id))
      .sort((a, b) => (a.name < b.name ? -1 : 1)) ?? [];
  const coreTagIds = coreTags?.map(tag => tag._id) ?? [];
  const subscribedTags = difference(defaultSubscribedTags, coreTagIds);

  // For core tags, bump them to the top of the list by adding a karma multiplier,
  // don't make the modifier too high, so that very old or low karma posts will still be excluded
  const coreTagFilterSettings = coreTagIds.map((tagId) => ({
    tagId,
    filterMode: "x30",
  }));

  const {timezone} = useTimezone();
  const now = moment().tz(timezone);
  const dateCutoff = now.subtract(maxAgeInDays, "days").format("YYYY-MM-DD");
  const { results, ...useMultiResult } = useMulti<FragmentTypeName, "Posts">({
    collectionName: "Posts",
    terms: {
      view: "magic",
      filterSettings: {
        tags: [
          ...requiredTags.map((tagId) => ({ tagId, filterMode: "Required" })),
          ...subscribedTags.map((tagId) => ({ tagId, filterMode: "Subscribed" })),
          ...coreTagFilterSettings,
        ],
      },
      after: dateCutoff,
      limit,
    },
    fragmentName,
    enableTotal: false,
    fetchPolicy: "cache-and-network",
  });

  // If all results have the same core tag as one on the input post, set this as the coreTagLabel. If there are multiple that
  // satisfy this choose the lowest alphabetically
  const allResultsCoreTags = results
    ?.flatMap((result) => Object.keys(result.tagRelevance))
    .filter((tagId) => coreTagIds.includes(tagId));
  const tagCounts = groupBy(allResultsCoreTags, (tagId) => tagId);
  const allowedLabelIds = Object.keys(tagCounts).filter(k => tagCounts[k].length === results?.length)
  const allowedLabelTags = coreTags.filter(t => allowedLabelIds.includes(t._id))

  const coreTagLabel = allowedLabelTags.length ? allowedLabelTags[0].name : null;

  return {
    results,
    ...useMultiResult,
    coreTagLabel,
  };
}
