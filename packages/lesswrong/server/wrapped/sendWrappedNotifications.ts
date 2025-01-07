import uniq from "lodash/uniq";
import ReadStatuses from "../../lib/collections/readStatus/collection";
import Users from "../../lib/collections/users/collection";
import { createNotifications } from "../notificationCallbacksHelpers";
import { Globals } from "../vulcan-lib";
import { WrappedYear, isWrappedYear } from "@/components/ea-forum/wrapped/hooks";

export const getWrappedUsers = async (
  year: WrappedYear,
): Promise<{_id: string, slug: string | null}[]> => {
  if (!isWrappedYear(year)) {
    throw new Error(`${year} is not a valid wrapped year`);
  }

  // Get all users who read a post the given year
  const start = new Date(year, 0);
  const end = new Date(year + 1, 0);
  const readStatuses = await ReadStatuses.find({
    isRead: true,
    lastUpdated: {$gte: start, $lte: end},
    postId: {$ne: null}
  }, {}, {userId: 1}).fetch();

  const userIds = uniq(readStatuses.map(rs => rs.userId));
  return Users.find({
    _id: {$in: userIds},
    banned: {$exists: false},
    deleted: {$ne: true},
  }, {}, {slug: 1}).fetch();
}

const sendWrappedNotifications = async (year: WrappedYear) => {
  const users = await getWrappedUsers(year);

  // eslint-disable-next-line no-console
  console.log(`Sending Wrapped ${year} notifications to ${users.length} users`);
  void createNotifications({
    userIds: users.map(u => u._id),
    notificationType: 'wrapped',
    documentId: null,
    documentType: null,
    extraData: {year},
    fallbackNotificationTypeSettings: {
      channel: "both",
      batchingFrequency: "realtime",
      timeOfDayGMT: 12,
      dayOfWeekGMT: "Monday",
    },
  });
}

Globals.sendWrappedNotifications = sendWrappedNotifications;
