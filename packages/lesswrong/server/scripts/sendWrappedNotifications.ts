import uniq from "lodash/uniq";
import moment from "moment";
import ReadStatuses from "../../lib/collections/readStatus/collection";
import Users from "../../lib/collections/users/collection";
import { createNotifications } from "../notificationCallbacksHelpers";
import { Globals } from "../vulcan-lib";

const sendWrappedNotifications = async () => {
  // notify all users who read a post in 2022
  const start = moment().year(2022).dayOfYear(1).toDate()
  const end = moment().year(2023).dayOfYear(0).toDate()
  const readStatuses = await ReadStatuses.find({
    isRead: true,
    lastUpdated: {$gte: start, $lte: end},
    postId: {$exists: true, $ne: null}
  }, {projection: {userId: 1}}).fetch()
  
  const userIds = uniq(readStatuses.map(rs => rs.userId))
  // filter out users who are banned
  const users = await Users.find({
    _id: {$in: userIds},
    banned: {$exists: false}
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
