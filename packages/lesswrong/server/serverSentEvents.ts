import type { Express, Response } from 'express';
import { getUserFromReq } from './vulcan-lib/apollo-server/context';
import { Notifications } from "../server/collections/notifications/collection";
import { getSiteUrl } from "../lib/vulcan-lib/utils";
import { disableServerSentEvents } from './databaseSettings';
import maxBy from 'lodash/maxBy';
import moment from 'moment';
import { ServerSentEventsMessage } from '../components/hooks/useUnreadNotifications';


interface ConnectionInfo {
  newestNotificationTimestamp: Date|null,
  res: Response
}

const openConnections: Record<string, ConnectionInfo[]> = {};

export function addServerSentEventsEndpoint(app: Express) {
  app.get('/api/notificationEvents', async (req, res) => {
    const parsedUrl = new URL(req.url, getSiteUrl())
    const apiVersionStr = parsedUrl.searchParams.get("version") ?? "1";
    const apiVersion = parseInt(apiVersionStr);
    const currentUser = getUserFromReq(req)

    // Can't subscribe to notifications if logged out
    if (!currentUser) {
      if (apiVersion===1) {
        // Wait awhile before closing the connection. A previous version of this
        // code would see the connection close, and try to reconnect after only
        // 3s, resulting in a very high number of reconnection requests. By
        // keeping the connection open for awhile (as we would for a logged-in
        // user's notifications channel), we slow down those requests.
        setTimeout(() => {
          // Status 204 ("no content") means the client should not rerequest,
          // according to the server-sent events spec.
          res.status(204).send();
        }, 120000);
      } else {
        res.status(204).send();
      }
      return;
    }
    
    
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client
    
    // If the disableServerSentEvents setting is set, send a message to request
    // that this client not try to reconnect. Only if apiVersion>=2.
    if (apiVersion>=2 && disableServerSentEvents.get()) {
      res.write(`data: {"stop":true}\n\n`);
      res.end();
      return;
    }
    
    const userId = currentUser._id;
    if (!(userId in openConnections)) {
      openConnections[userId] = [{res, newestNotificationTimestamp: null}];
    } else {
      openConnections[userId].push({res, newestNotificationTimestamp: null});
    }

    // If client closes connection, stop sending events
    res.on('close', () => {
      openConnections[userId] = openConnections[userId].filter(r => r.res!==res);
      if (!openConnections[userId].length)
        delete openConnections[userId];
      res.end();
    });
  });
  
  setInterval(checkForNotifications, 1000);
}

/*
 * FIXME: This function can't be used in practice because it only works if the
 * user is connected to the same server as this function is called on, but user
 * server-sent event connections are sent by the load balancer to a randomly
 * selected server.
 */
function sendSseMessageToUser(userId: string, message: ServerSentEventsMessage) {
  const userConnections = openConnections[userId];
  if (!userConnections) {
    // TODO: do we want to log an error here?  Probably not, it'll be happening reasonably often for innocous reasons
    // eslint-disable-next-line no-console
    console.log(`No connections found for user id ${userId}`, message);
    return;
  }

  for (let userConnection of userConnections) {
    userConnection.res.write(`data: ${JSON.stringify(message)}\n\n`);
  }
}

let lastNotificationCheck = new Date();
let lastTypingIndicatorsCheck = new Date();
let lastActiveDialoguePartnersMessage = new Date();

async function checkForNotifications() {
  const numOpenConnections = Object.keys(openConnections).length;
  if (!numOpenConnections) {
    return;
  }

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
          const message: ServerSentEventsMessage = {
            eventType: "notificationCheck",
            newestNotificationTime: newTimestamp.toISOString(),
          };
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

const isRecentlyActive = (editedAt: Date | undefined, minutes: number): boolean => {
  if (!editedAt) {
    return false;
  }

  const currentTime = new Date().getTime();
  const editedTime = new Date(editedAt).getTime();

  return (currentTime - editedTime) <= minutes * 60 * 1000;
}
