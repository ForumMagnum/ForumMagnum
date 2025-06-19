import { hasKeywordsAlerts } from "@/lib/betas";
import { addCronJob } from "../cron/cronUtil";
import { createNotifications } from "../notificationCallbacksHelpers";
import { createAdminContext } from "../vulcan-lib/createContexts";
import { fetchPostIdsForKeyword } from "./keywordSearch";
import { getDefaultKeywordStartDate, KEYWORD_INTERVAL_HOURS } from "@/lib/keywordAlertHelpers";
import UsersRepo from "../repos/UsersRepo";

export const generateKeywordAlerts = async () => {
  if (!hasKeywordsAlerts) {
    return;
  }

  const context = createAdminContext();
  const startDate = getDefaultKeywordStartDate()
  const usersRepo = new UsersRepo();
  const alerts = await usersRepo.getUserIdsByKeywordAlerts();

  for (const {keyword, userIds} of alerts) {
    const postIds = await fetchPostIdsForKeyword(keyword, startDate);
    if (!postIds.length) {
      continue;
    }
    await createNotifications({
      context,
      userIds,
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
}

export const keywordAlertsCron = addCronJob({
  name: "keywordAlerts",
  interval: `every ${KEYWORD_INTERVAL_HOURS} hours`,
  job: generateKeywordAlerts,
});
