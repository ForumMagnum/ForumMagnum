import { createNotification } from "@/server/notificationCallbacksHelpers";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { captureException } from "@sentry/core";
import { addCronJob } from "@/server/cronUtil";
import Comments from "../comments/collection";
import CommentAwards from "./collection";
import uniq from "lodash/uniq";

const dollarsPerPrize = 100;

export const sendCommentAwardNotifications = async () => {
  const now = new Date();
  // We only send notifications for awards created at least 30 minutes ago to
  // give a buffer to remove the award without sending the notification.
  const cutoff = new Date(now.getTime() - 30 * 60 * 1000)

  const awards = await CommentAwards.find({
    createdAt: { $lt: cutoff },
    isDeleted: false,
    notifiedAt: { $exists: false },
  }).fetch();
  // eslint-disable-next-line no-console
  console.log(`Comment award notifications: found ${awards.length} awards`);
  if (!awards.length) {
    return;
  }

  const commentIds = uniq(awards.map(({ commentId }) => commentId));
  const countByCommentId = awards.reduce((map, { commentId, count }) => {
    map[commentId] = (map[commentId] ?? 0) + count;
    return map;
  }, {} as Record<string, number>);
  const comments = await Comments.find({
    _id: { $in: commentIds },
  }).fetch();
  // eslint-disable-next-line no-console
  console.log(`Comment award notifications: found ${comments.length} comments`);
  if (!comments.length) {
    return;
  }

  const commentsById = Object.fromEntries(
    comments.map((comment) => [comment._id, comment]),
  );
  const context = createAdminContext();

  const successfullyNotifiedCommentIds = new Set<string>();
  for (const commentId of commentIds) {
    const comment = commentsById[commentId];
    if (!comment) {
      continue;
    }
    try {
      await createNotification({
        context,
        userId: comment.userId,
        notificationType: "commentAwarded",
        documentType: "comment",
        documentId: commentId,
        extraData: {
          count: countByCommentId[commentId],
          dollarsPerPrize,
        },
      });
      successfullyNotifiedCommentIds.add(commentId);
      // eslint-disable-next-line no-console
      console.log(`Comment award notifications: created for comment ${commentId}`);
    } catch (e) {
      console.error(e);
      captureException(e);
    }
  }

  const successfullyNotifiedAwardIds = awards
    .filter(({ commentId }) => successfullyNotifiedCommentIds.has(commentId))
    .map(({ _id }) => _id);
  if (!successfullyNotifiedAwardIds.length) {
    return;
  }

  await CommentAwards.rawUpdateMany(
    { _id: { $in: successfullyNotifiedAwardIds } },
    { $set: { notifiedAt: now } },
  );
}

export const commentAwardsCron = addCronJob({
  name: "commentAwardNotifications",
  interval: "every 30 minutes",
  job() {
    void sendCommentAwardNotifications();
  },
});
