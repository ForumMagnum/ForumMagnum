import type { Express, Response } from 'express';
import { getUserFromReq } from './vulcan-lib/apollo-server/context';
import { Notifications } from "../lib/collections/notifications/collection";
import { getSiteUrl } from "../lib/vulcan-lib/utils";
import { DatabaseServerSetting } from './databaseSettings';
import maxBy from 'lodash/maxBy';
import moment from 'moment';
import { Posts } from '../lib/collections/posts';
import uniq from 'lodash/uniq';
import type { ConnectionMessage } from '../client/serverSentEventsClient';
import {getConfirmedCoauthorIds} from '../lib/collections/posts/helpers';

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
  setInterval(checkForTypingIndicators, 1000);
}

let lastNotificationCheck = new Date();

async function checkForTypingIndicators() {
  const numOpenConnections = Object.keys(openConnections).length;
  if (!numOpenConnections) {
    return;
  }

  // TODO actually load real typingIndicators from the db

  // const newTypingIndicators = await TypingIndicators.find({
  //   lastUpdated: {$gt: lastNotificationCheck}
  // }, {
  //   projection: {userId:1, lastUpdated:1, documentId:1}
  // }).fetch();

  const newTypingIndicatorsDummy: TypingIndicatorInfo[] = [{
      _id: "1",
      userId: "r38pkCm7wF4M44MDQ", // raemon
      documentId: "5qYcLQ8vcXjcpeC2D", // dialogue on stuff
      lastUpdated: new Date()
    }, {
      _id: "2",
      userId: "gXeEWGjTWyqgrQTzR", // jacobjacob
      documentId: "5qYcLQ8vcXjcpeC2D", // dialogue on stuff
      lastUpdated: new Date()
    },
    {
      _id: "3",
      userId: "gXeEWGjTWyqgrQTzR", // jacobjacob
      documentId: "cCnK8CxNKZqxakmsG", // coconut
      lastUpdated: new Date()
    },
    {
      _id: "4",
      userId: "i7cWXn8ApqsBaQDre", // testcob ultron
      documentId: "5qYcLQ8vcXjcpeC2D", // dialogue on stuff
      lastUpdated: new Date()
    },
    {
      _id: "5",
      userId: "kyf5Dfouz6c2udioL", // raemon test
      documentId: "cCnK8CxNKZqxakmsG", // coconut
      lastUpdated: new Date()
    },
    {
      _id: "6",
      userId: "XtphY3uYHwruKqDyG", // habryka
      documentId: "Bc9DHPrFJAGZ26bum", // otter world (includes jacobjacob, kave, habryka, raemo)
      lastUpdated: new Date()
    },
    {
      _id: "7",
      userId: "55XxDBpfKkkBPm9H8", // kave
      documentId: "Bc9DHPrFJAGZ26bum", // otter world (includes jacobjacob, kave, habryka, raemon)
      lastUpdated: new Date()
    }
  ]

  //dialog on stuff has 
    // raemon, testcob ultron
  // coconut has
    // jacob, raemontest
  // Otter world
    // jacobjacob, kave, habryka, raemon

  const listOfPosts = uniq(newTypingIndicatorsDummy.map(indicator => indicator.documentId))

  const posts = await Posts.find({
    _id: {$in:listOfPosts}}, {
    projection: {_id: 1, userId: 1, coauthorStatuses: 1, shareWithUsers: 1}
  }).fetch()

  const postsWithUserIds: Record<string, string[]> = {}
  for (let post of posts) {
    const coauthorIds = getConfirmedCoauthorIds(post) // post.coauthorStatuses ? post.coauthorStatuses.map(coauthor => coauthor.userId) : []
    const shareWithUsersIds = post.shareWithUsers ?? []
    postsWithUserIds[post._id] = [...coauthorIds, ...shareWithUsersIds, post.userId]
  }
  
  const usersWithPostIds: Record<string, string[]> = {}
  // map users to posts
  for (let postId of Object.keys(postsWithUserIds)) {
    const userIds = postsWithUserIds[postId]
    for (let userId of userIds) {
      if (userId in usersWithPostIds) {
        usersWithPostIds[userId].push(postId)
      } else {
        usersWithPostIds[userId] = [postId]
      }
    }
  }

  const postsWithTypingIndicators: Record<string, TypingIndicatorInfo[]> = {}
  for (let typingIndicator of newTypingIndicatorsDummy) {
    const postId = typingIndicator.documentId
    if (postId in postsWithTypingIndicators) {
      postsWithTypingIndicators[postId].push(typingIndicator)
    } else {
      postsWithTypingIndicators[postId] = [typingIndicator]
    }
  }

  const usersReceivingTypingIndicators: Record<string, TypingIndicatorInfo[]> = {}
  for (let postId of Object.keys(postsWithTypingIndicators)) {
    const typingIndicators = postsWithTypingIndicators[postId]
    const userIds = postsWithUserIds[postId]
   // console.log("used ids: ", userIds, "typing indicators: ", typingIndicators)
    for (let userId of userIds) {
      if (userId in usersReceivingTypingIndicators) {
        usersReceivingTypingIndicators[userId].push(...typingIndicators)
      } else {
        usersReceivingTypingIndicators[userId] = typingIndicators
      }
    }
  }

  for (let userId of Object.keys(usersReceivingTypingIndicators)) {
    if (openConnections[userId]) {
      for (let connection of openConnections[userId]) {
        const message : ConnectionMessage = {eventType: "typingIndicator", typingIndicators: usersReceivingTypingIndicators[userId]}
        connection.res.write(`data: ${JSON.stringify(message)}\n\n`)
      }
  
    }
  }
}

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
          const message: ConnectionMessage = { eventType: "notificationCheck", newestNotificationTime: newTimestamp };
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
