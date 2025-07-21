import { hasKeywordAlerts } from "@/lib/betas";
import { addCronJob } from "../cron/cronUtil";
import { createNotifications } from "../notificationCallbacksHelpers";
import { createAdminContext } from "../vulcan-lib/createContexts";
import { getNotificationTypeByName } from "@/lib/notificationTypes";
import {
  fetchCommentIdsForKeyword,
  fetchPostIdsForKeyword,
  getDefaultKeywordStartDate,
} from "./keywordSearch";
import CronHistories from "../collections/cronHistories/collection";
import Notifications from "../collections/notifications/collection";
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
    // Find matching documents in elasticsearch
    const [postIds, commentIds] = await Promise.all([
      fetchPostIdsForKeyword(keyword, startDate, endDate),
      fetchCommentIdsForKeyword(keyword, startDate, endDate),
    ]);
    if (!postIds.length && !commentIds.length) {
      continue;
    }

    // Create the data for the notificaitons. Notifications need a content
    // type: if there are any posts then use that, otherwise fallback to comments
    const contentType = postIds.length ? "post" : "comment";
    const extraData = {
      keyword,
      count: postIds.length + commentIds.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      contentType,
    };
    const notificationDocumentId = postIds[0] ?? commentIds[0];
    const notificationType = getNotificationTypeByName("keywordAlert");

    // For users that already have an alert notification for this keyword that
    // they haven't read yet, grab that notification and update it instead of
    // creating a new one. This is a bit hacky - the rest of the code base
    // treats notifications as immutable, but keyword alerts behave a bit more
    // "realtime" than other notifications, even when batching is enabled.
    const updatePromises: Promise<unknown>[] = [];
    const userIdsToNotify: string[] = [];
    for (const userId of userIds) {
      const openNotification = await Notifications.findOne({
        userId,
        type: notificationType.name,
        viewed: {$ne: true},
        emailed: {$ne: true},
        "extraData.keyword": keyword,
      }, {sort: {createdAt: -1}});

      if (openNotification) {
        const newExtraData = {
          ...extraData,
          // If you run this function manually then this count may not quite
          // be correct as documents may be double counted. During regular use
          // from the cron job this shouldn't happen as the windows should
          // never overlap. This could be fixed, but it'd require adding an
          // extra database roundtrip for ever iteration of the loop, and that's
          // probably not worth it for something that should never happen in
          // practice.
          count: openNotification.extraData.count + extraData.count,
          startDate: openNotification.extraData.startDate,
          contentType: contentType === "post"
            ? "post"
            : openNotification.extraData.contentType,
          extendedAt: endDate,
        };
        const message = await notificationType.getMessage({
          documentType: contentType,
          documentId: notificationDocumentId,
          extraData,
          context,
        });
        const link = notificationType.getLink?.({
          documentType: contentType,
          documentId: notificationDocumentId,
          extraData,
        });
        updatePromises.push(Notifications.rawUpdateOne({
          _id: openNotification._id,
        }, {
          $set: {
            message,
            link,
            documentId: notificationDocumentId,
            extraData: newExtraData,
          },
        }));
      } else {
        userIdsToNotify.push(userId);
      }
    }

    // Create notifications for any users who didn't have an updateable
    // notification, and await the rest of the updates
    await Promise.all([
      createNotifications({
        context,
        userIds: userIdsToNotify,
        notificationType: notificationType.name,
        documentType: contentType,
        documentId: notificationDocumentId,
        extraData,
      }),
      ...updatePromises,
    ]);
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
