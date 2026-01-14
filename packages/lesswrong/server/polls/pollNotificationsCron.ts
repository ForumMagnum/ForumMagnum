import { hasPolls } from "@/lib/betas";
import { addCronJob } from "../cron/cronUtil";
import { createNotifications } from "../notificationCallbacksHelpers";
import { createAdminContext } from "../vulcan-lib/createContexts";
import ForumEventsRepo from "../repos/ForumEventsRepo";
import { getPollUrl, stripFootnotes } from "@/lib/collections/forumEvents/helpers";
import { Notifications } from "../collections/notifications/collection";

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const TWO_DAYS_MS = 2 * ONE_DAY_MS;

function getVoterUserIds(publicData: Record<string, unknown> | null): string[] {
  if (!publicData) return [];
  return Object.keys(publicData).filter(key => key !== "format");
}

async function getPollQuestion(context: ResolverContext, forumEventId: string): Promise<string> {
  const forumEvent = await context.loaders.ForumEvents.load(forumEventId);
  if (!forumEvent?.pollQuestion_latest) return "Poll";

  const revision = await context.loaders.Revisions.load(forumEvent.pollQuestion_latest);
  if (!revision?.html) return "Poll";

  return stripFootnotes(revision.html) || "Poll";
}

async function getUsersAlreadyNotified(pollId: string, notificationType: string): Promise<Set<string>> {
  const existingNotifications = await Notifications.find({
    type: notificationType,
    "extraData.pollId": pollId,
  }, {
    projection: { userId: 1 },
  }).fetch();

  return new Set(existingNotifications.map(n => n.userId));
}

function getNotificationLeadTime(startDate: Date | null, endDate: Date): number {
  if (!startDate) {
    // If no start date, assume it's a longer poll
    return ONE_DAY_MS;
  }
  const duration = endDate.getTime() - startDate.getTime();
  return duration < TWO_DAYS_MS ? 2 * ONE_HOUR_MS : ONE_DAY_MS;
}

async function sendPollClosingSoonNotifications() {
  const context = createAdminContext();
  const forumEventsRepo = new ForumEventsRepo();

  const now = new Date();
  // Query polls closing in the next 27 hours to catch both 2-hour and 1-day windows
  const maxEndDate = new Date(now.getTime() + ONE_DAY_MS + (3 * ONE_HOUR_MS));
  const closingPolls = await forumEventsRepo.getPollsClosingBetween(now, maxEndDate);

  for (const poll of closingPolls) {
    if (!poll.derivedPostId) continue;

    const leadTime = getNotificationLeadTime(poll.startDate, poll.endDate);
    const notificationTime = new Date(poll.endDate.getTime() - leadTime);

    if (now < notificationTime) continue;

    const alreadyNotified = await getUsersAlreadyNotified(poll._id, "pollClosingSoon");

    const post = await context.loaders.Posts.load(poll.derivedPostId);
    if (!post) continue;

    const pollQuestion = await getPollQuestion(context, poll._id);
    const link = getPollUrl(post, poll._id);

    const creatorSet = new Set(poll.creatorUserIds.filter(Boolean));
    const voterUserIds = getVoterUserIds(poll.publicData);

    // Notify creators
    const creatorsToNotify = poll.creatorUserIds.filter(id => id && !alreadyNotified.has(id));
    if (creatorsToNotify.length > 0) {
      await createNotifications({
        context,
        userIds: creatorsToNotify,
        notificationType: "pollClosingSoon",
        documentType: "post",
        documentId: poll.derivedPostId,
        extraData: {
          pollId: poll._id,
          pollQuestion,
          link,
          isCreator: true,
        },
      });
    }

    // Notify voters
    const votersToNotify = voterUserIds.filter(id => !creatorSet.has(id) && !alreadyNotified.has(id));
    if (votersToNotify.length > 0) {
      await createNotifications({
        context,
        userIds: votersToNotify,
        notificationType: "pollClosingSoon",
        documentType: "post",
        documentId: poll.derivedPostId,
        extraData: {
          pollId: poll._id,
          pollQuestion,
          link,
          isCreator: false,
        },
      });
    }
  }
}

async function sendPollClosedNotifications() {
  const context = createAdminContext();
  const forumEventsRepo = new ForumEventsRepo();

  const now = new Date();
  // Look back up to 24 hours for closed polls
  const minEndDate = new Date(now.getTime() - ONE_DAY_MS);
  const closedPolls = await forumEventsRepo.getPollsClosedBetween(minEndDate, now);

  for (const poll of closedPolls) {
    if (!poll.derivedPostId) continue;

    const alreadyNotified = await getUsersAlreadyNotified(poll._id, "pollClosed");

    const post = await context.loaders.Posts.load(poll.derivedPostId);
    if (!post) continue;

    const pollQuestion = await getPollQuestion(context, poll._id);
    const link = getPollUrl(post, poll._id);

    const creatorSet = new Set(poll.creatorUserIds.filter(Boolean));
    const voterUserIds = getVoterUserIds(poll.publicData);

    // Notify creators
    const creatorsToNotify = poll.creatorUserIds.filter(id => id && !alreadyNotified.has(id));
    if (creatorsToNotify.length > 0) {
      await createNotifications({
        context,
        userIds: creatorsToNotify,
        notificationType: "pollClosed",
        documentType: "post",
        documentId: poll.derivedPostId,
        extraData: {
          pollId: poll._id,
          pollQuestion,
          link,
          isCreator: true,
        },
      });
    }

    // Notify voters
    const votersToNotify = voterUserIds.filter(id => !creatorSet.has(id) && !alreadyNotified.has(id));
    if (votersToNotify.length > 0) {
      await createNotifications({
        context,
        userIds: votersToNotify,
        notificationType: "pollClosed",
        documentType: "post",
        documentId: poll.derivedPostId,
        extraData: {
          pollId: poll._id,
          pollQuestion,
          link,
          isCreator: false,
        },
      });
    }
  }
}

export const pollNotificationsCron = addCronJob({
  name: "pollNotifications",
  interval: "every 1 hour",
  job: async () => {
    if (!hasPolls) {
      return;
    }

    await sendPollClosingSoonNotifications();
    await sendPollClosedNotifications();
  },
});
