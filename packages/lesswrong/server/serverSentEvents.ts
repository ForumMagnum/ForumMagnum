import type { Express, Response } from 'express';
import { getUserFromReq } from './vulcan-lib/apollo-server/context';
import { Notifications } from "../lib/collections/notifications/collection";
import { getSiteUrl } from "../lib/vulcan-lib/utils";
import { DatabaseServerSetting } from './databaseSettings';
import maxBy from 'lodash/maxBy';
import moment from 'moment';
import { getConfirmedCoauthorIds } from '../lib/collections/posts/helpers';
import { ActiveDialogue, ActiveDialogueServer, ServerSentEventsMessage, TypingIndicatorMessage } from '../components/hooks/useUnreadNotifications';
import TypingIndicatorsRepo from './repos/TypingIndicatorsRepo';
import UsersRepo from './repos/UsersRepo';
import { isEAForum } from '../lib/instanceSettings';

const disableServerSentEvents = new DatabaseServerSetting<boolean>("disableServerSentEvents", false);

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
    const currentUser = await getUserFromReq(req)

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
  if (!isEAForum) {
    setInterval(checkForTypingIndicators, 1000);
    setInterval(checkForActiveDialoguePartners, 1000);
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


async function checkForTypingIndicators() {
  const numOpenConnections = Object.keys(openConnections).length;
  if (!numOpenConnections) {
    return;
  }

  const typingIndicatorInfos = await new TypingIndicatorsRepo().getRecentTypingIndicators(lastTypingIndicatorsCheck)

  if (typingIndicatorInfos.length > 0) {
    // Take the newest lastUpdated of a typingIndicator we saw, or one second ago,
    // whichever is earlier, as the cutoff date for the next query. 
    // See checkForNotifications for more details.
    const newestTypingIndicatorDate: Date = maxBy(typingIndicatorInfos, n=>new Date(n.lastUpdated))!.lastUpdated;
    const oneSecondAgo = moment().subtract(1, 'seconds').toDate();
    if (newestTypingIndicatorDate > oneSecondAgo) {
      lastTypingIndicatorsCheck = oneSecondAgo;
    } else {
      lastTypingIndicatorsCheck = newestTypingIndicatorDate;
    }
  }

  const results: Record<string, TypingIndicatorInfo[]> = {};
  for (const curr of typingIndicatorInfos) {
    // Get all userIds that have permission to type on the post
    const userIdsToNotify = [curr.postUserId, ...getConfirmedCoauthorIds(curr)].filter((userId) => userId !== curr.userId);
  
    for (const userIdToNotify of userIdsToNotify) {
      const {_id, userId, documentId, lastUpdated} = curr; // filter to just the fields in TypingIndicatorInfo
      if (results[userIdToNotify]) {
        results[userIdToNotify].push({_id, userId, documentId, lastUpdated});
      } else {
        results[userIdToNotify] = [{_id, userId, documentId, lastUpdated}];
      }
    }
  }
  
  for (let userId of Object.keys(results)) {
    if (openConnections[userId]) {
      for (let connection of openConnections[userId]) {
        const message: TypingIndicatorMessage = {
          eventType: "typingIndicator", 
          typingIndicators: results[userId],
        }
        connection.res.write(`data: ${JSON.stringify(message)}\n\n`)
      }
    }
  }
}

const isRecentlyActive = (editedAt: Date | undefined, minutes: number): boolean => {
  if (!editedAt) {
    return false;
  }

  const currentTime = new Date().getTime();
  const editedTime = new Date(editedAt).getTime();

  return (currentTime - editedTime) <= minutes * 60 * 1000;
}

async function checkForActiveDialoguePartners() {
  const numOpenConnections = Object.keys(openConnections).length;
  if (!numOpenConnections) {
    return;
  }

  const userIds = Object.keys(openConnections);

  const activeDialogues: ActiveDialogueServer[] = await new UsersRepo().getActiveDialogues(userIds);

  const allUsersDialoguesData: Record<string, ActiveDialogue[]> = {};
  for (let dialogue of activeDialogues) {
    const coauthorUserIds = dialogue.coauthorStatuses.map((status: any) => status.userId);
    const allUserIds = [dialogue.userId, ...coauthorUserIds];
    for (let userId of allUserIds) {
      const editedAt = dialogue?.mostRecentEditedAt;
      const data = {
        postId: dialogue._id,
        title: dialogue.title,
        userIds: dialogue.activeUserIds.filter((id => id !== userId)),
        mostRecentEditedAt: editedAt,
        anyoneRecentlyActive: isRecentlyActive(editedAt, 15) // within the last 15 min
      }
      if (allUsersDialoguesData[userId]) {
        allUsersDialoguesData[userId].push(data);
      } else {
        allUsersDialoguesData[userId] = [data];
      }
    }
  }

  for (let userId of userIds) {
    const userDialoguesData = allUsersDialoguesData[userId];
    const message = {
      eventType: "activeDialoguePartners",
      data: userDialoguesData ?? []
    };

    const messageString = `data: ${JSON.stringify(message)}\n\n`;

    if (openConnections[userId]) {
      for (let connection of openConnections[userId]) {
        connection.res.write(messageString);
        connection.newestNotificationTimestamp = new Date();
      } 
    }
  }
}
