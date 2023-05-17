import type { Express, Response } from 'express';
import { getUserFromReq } from './vulcan-lib/apollo-server/context';
import { Notifications } from "../lib/collections/notifications/collection";
import maxBy from 'lodash/maxBy';
import moment from 'moment';

interface ConnectionInfo {
  newestNotificationTimestamp: Date|null,
  res: Response
}
const openConnections: Record<string, ConnectionInfo[]> = {};

export function addServerSentEventsEndpoint(app: Express) {
  app.get('/api/notificationEvents', async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client
    const currentUser = await getUserFromReq(req)
    
    // Can't subscribe if logged out
    if (!currentUser) {
      res.end();
      return;
    }
    
    const userId = currentUser._id;
    console.log(`Opened notification channel for user ${userId}`); //DEBUG
    if (!(userId in openConnections)) {
      openConnections[userId] = [{res, newestNotificationTimestamp: null}];
    } else {
      openConnections[userId].push({res, newestNotificationTimestamp: null});
    }

    // If client closes connection, stop sending events
    res.on('close', () => {
      console.log(`Notification channel for user ${userId} disconnected`); //DEBUG
      openConnections[userId] = openConnections[userId].filter(r => r.res!==res);
      if (!openConnections[userId].length)
        delete openConnections[userId];
      res.end();
    });
  });
  
  setInterval(checkForNotifications, 1000);
}

let lastNotificationCheck = new Date();

async function checkForNotifications() {
  const newNotifications = await Notifications.find({
    createdAt: {$gt: lastNotificationCheck}
  }, {
    projection: {userId:1, createdAt:1}
  }).fetch();
  
  // TODO: Handle waitingForBatch
  // If a notification is batched, then delivering the batch means clearing the
  // waitingForBatch flag, but I don't think it updates the `createdAt` flag,
  // which will cause batched notifications to get missed.

  if (newNotifications.length > 0) {
    // Take the newest createdAt of a notification we saw, or one second ago,
    // whichever is earlier, as the cutoff date for the next query. The
    // one-second-ago case is to handle potential concurrency issues in the
    // database where, if two notifications are created at close to the same
    // time, then having received the one with the newer timestamp as a result
    // does not guarantee that the one with the older timestamp has actually
    // committed.
    // (This concurrency issue was inferred from theory, we did not observe a
    // problem happening in practice and expect that the problem would occur
    // rarely if this was wrong)
    const newestNotificationDate: Date = maxBy(newNotifications, n=>new Date(n.createdAt))!.createdAt;
    const oneSecondAgo = moment().subtract(1, 'seconds').toDate();
    if (newestNotificationDate > oneSecondAgo) {
      lastNotificationCheck = oneSecondAgo;
    } else {
      lastNotificationCheck = newestNotificationDate;
    }
  }

  const usersWithNewNotifications: Record<string,Date> = {};
  for (let notification of newNotifications) {
    const userId = notification.userId;
    if (userId in usersWithNewNotifications) {
      usersWithNewNotifications[userId] = dateMax(usersWithNewNotifications[userId], notification.createdAt);
    } else {
      usersWithNewNotifications[userId] = notification.createdAt;
    }
  }
  
  for (let userId of Object.keys(usersWithNewNotifications)) {
    const newTimestamp = usersWithNewNotifications[userId];
    if (openConnections[userId]) {
      for (let connection of openConnections[userId]) {
        if (!connection.newestNotificationTimestamp
          || connection.newestNotificationTimestamp < newTimestamp
        ) {
          const message = { newestNotificationTime: newTimestamp };
          connection.res.write(`data: ${JSON.stringify(message)}\n\n`);
          connection.newestNotificationTimestamp = newTimestamp;
        }
      }
    }
  }
}

function dateMax(a: Date, b: Date) {
  if (a.getTime() > b.getTime())
    return a;
  else
    return b;
}
