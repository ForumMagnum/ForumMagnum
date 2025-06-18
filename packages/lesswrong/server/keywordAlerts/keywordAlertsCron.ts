import { hasKeywordsAlerts } from "@/lib/betas";
import { addCronJob } from "../cron/cronUtil";
import { createNotification } from "../notificationCallbacksHelpers";
import { createAdminContext } from "../vulcan-lib/createContexts";
import { fetchPostIdsForKeyword } from "./keywordSearch";
import {
  getDefaultKeywordStartDate,
  KEYWORD_INTERVAL_HOURS,
} from "@/lib/keywordAlertHelpers";

export const generateKeywordAlerts = async () => {
  if (!hasKeywordsAlerts) {
    return;
  }

  const context = createAdminContext();
  const startDate = getDefaultKeywordStartDate()
  const userId = "D5tAFjN5axTcp9mGL";
  const keyword = "test";
  const postIds = await fetchPostIdsForKeyword(keyword, startDate);
  if (!postIds.length) {
    return;
  }
  await createNotification({
    context,
    userId,
    notificationType: "keywordAlert",
    documentType: "post",
    documentId: postIds[0],
    extraData: {
      keyword,
      count: postIds.length,
      startDate: startDate.toISOString(),
    },
  });
}

export const keywordAlertsCron = addCronJob({
  name: "keywordAlerts",
  interval: `every ${KEYWORD_INTERVAL_HOURS} hours`,
  job: generateKeywordAlerts,
});
