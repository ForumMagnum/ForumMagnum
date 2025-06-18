import { addCronJob } from "../cron/cronUtil";
import { fetchPostIdsForKeyword } from "./keywordSearch";
import { KEYWORD_INTERVAL_HOURS } from "@/lib/keywordAlertHelpers";

export const runKeywordAlerts = async () => {
  const keyword = "test";
  const posts = await fetchPostIdsForKeyword(keyword);
  // TODO
  // eslint-disable-next-line no-console
  console.log(posts);
}

export const keywordAlertsCron = addCronJob({
  name: "keywordAlerts",
  interval: `every ${KEYWORD_INTERVAL_HOURS} hours`,
  job: runKeywordAlerts,
});
