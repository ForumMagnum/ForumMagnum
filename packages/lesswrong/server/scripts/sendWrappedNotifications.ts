import uniq from "lodash/uniq";
import ReadStatuses from "../../lib/collections/readStatus/collection";
import Users from "../../lib/collections/users/collection";
import { createNotifications } from "../notificationCallbacksHelpers";
import { Globals } from "../vulcan-lib";

const sendWrappedNotifications = async () => {
  // notify all users who read a post in 2023
  const start = new Date(2023, 0)
  const end = new Date(2024, 0)
  const readStatuses = await ReadStatuses.find({
    isRead: true,
    lastUpdated: {$gte: start, $lte: end},
    postId: {$ne: null}
  }, {projection: {userId: 1}}).fetch()
  
  const userIds = uniq(readStatuses.map(rs => rs.userId))
  // filter out users who are banned, deleted, or have unsubscribed from all emails
  const users = await Users.find({
    _id: {$in: userIds},
    banned: {$exists: false},
    unsubscribeFromAll: {$ne: true},
    deleted: {$ne: true},
  }, {projection: {slug: 1}}).fetch()

  // eslint-disable-next-line no-console
  console.log(`Sending Wrapped notifications to ${users.length} users`)

  void createNotifications({
    userIds: users.map(u => u._id),
    notificationType: 'wrapped',
    documentId: null,
    documentType: null
  })
}

Globals.sendWrappedNotifications = sendWrappedNotifications;
