import moment from "moment";
import { useTimezone } from "../common/withTimezone";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";

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
      filterSettings: {tags: [{
        tagId: "z8qFsGt5iXyZiLbjN", // topics/opportunities-to-take-action
        filterMode: "Required",
      }]},
      after: dateCutoff,
      limit,
    },
    fragmentName,
    enableTotal: false,
    fetchPolicy: "cache-and-network",
  });
}
