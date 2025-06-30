import { hasKeywordAlerts } from "@/lib/betas";
import { addCronJob } from "../cron/cronUtil";
import { createNotifications } from "../notificationCallbacksHelpers";
import { createAdminContext } from "../vulcan-lib/createContexts";
import { fetchPostIdsForKeyword } from "./keywordSearch";
import { getDefaultKeywordStartDate } from "@/lib/keywordAlertHelpers";
import CronHistories from "../collections/cronHistories/collection";
import UsersRepo from "../repos/UsersRepo";

export const generateKeywordAlerts = async (
  startDate: Date = getDefaultKeywordStartDate(),
) => {
  if (!hasKeywordAlerts) {
    return;
  }

  const context = createAdminContext();
  const endDate = new Date();
  const usersRepo = new UsersRepo();
  const alerts = await usersRepo.getUserIdsByKeywordAlerts();

  for (const {keyword, userIds} of alerts) {
    const postIds = await fetchPostIdsForKeyword(keyword, startDate, endDate);
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
        endDate: endDate.toISOString(),
        // Currently keyword alerts only support posts, but we're adding this
        // content type to future-proof so we can expand to comments in the
        // future
        contentType: "post",
      },
    });
  }
}

export const keywordAlertsCron = addCronJob({
  name: "keywordAlerts",
  interval: "every 30 minutes",
  job: async () => {
    if (!hasKeywordAlerts) {
      return;
    }

    const lastRun = await CronHistories.findOne({
      name: "keywordAlerts",
      finishedAt: {$exists: true},
    }, {sort: {intendedAt: -1}});
    if (!lastRun?.finishedAt) {
      return;
    }

    await generateKeywordAlerts(lastRun.finishedAt);
  },
});
