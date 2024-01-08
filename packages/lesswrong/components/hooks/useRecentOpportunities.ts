import moment from "moment";
import { useTimezone } from "../common/withTimezone";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";

const requiredTags: string[] = [
  "z8qFsGt5iXyZiLbjN", // Opportunities to take action
];

const subscribedTags: string[] = [
  "fCcrMpyRbozMfwYPF", // Application announcements
  "be4pBryMKxLhkmgvE", // Funding opportunities
  "2BvgFyR85zX25osTT", // Fellowships and internships
  "54Ls7K7N53kYws9ja", // Job listing (open)
  "vgT4Fiybt4qjHLoBv", // Bounty (open)
  "ihpwNfh2ZxR4ZHaAK", // Prizes and contests
];

export const useRecentOpportunities =<
  FragmentTypeName extends keyof FragmentTypes
> ({
  fragmentName,
  limit = 3,
  maxAgeInDays = 7,
}: {
  fragmentName: FragmentTypeName,
  limit?: number,
  maxAgeInDays?: number,
}): UseMultiResult<FragmentTypeName> => {
  const {timezone} = useTimezone();
  const now = moment().tz(timezone);
  const dateCutoff = now.subtract(maxAgeInDays, "days").format("YYYY-MM-DD");
  return useMulti<FragmentTypeName, "Posts">({
    collectionName: "Posts",
    terms: {
      view: "magic",
      filterSettings: {tags: [
        ...requiredTags.map((tagId) => ({tagId, filterMode: "Required"})),
        ...subscribedTags.map((tagId) => ({tagId, filterMode: "Subscribed"})),
      ]},
      after: dateCutoff,
      limit,
    },
    fragmentName,
    enableTotal: false,
    fetchPolicy: "cache-and-network",
  });
}
