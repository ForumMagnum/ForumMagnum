import { randomId } from "@/lib/random";
import { createAdminContext } from "../vulcan-lib";
import { registerMigration } from "./migrationUtils";
import groupBy from "lodash/groupBy";
import uniq from "lodash/uniq";

function chunkWithoutSplitting<T>(dict: Record<string, T[]>, limit: number): T[][] {
  const result: T[][] = [];
  let currentChunk: T[] = [];

  for (const key in dict) {
    const values = dict[key];

    if (currentChunk.length + values.length <= limit) {
      currentChunk.push(...values);
    } else {
      if (currentChunk.length > 0) {
        result.push(currentChunk);
        currentChunk = [];
      }

      currentChunk.push(...values);

      if (currentChunk.length > limit) {
        // eslint-disable-next-line no-console
        console.log(`Chunked ${currentChunk.length} values for id ${key}, which is over the ${limit} limit`);
        result.push(currentChunk);
        currentChunk = [];
      }
    }
  }

  if (currentChunk.length > 0) {
    result.push(currentChunk);
  }

  return result;
}



registerMigration({
  name: "backfillUserFeedSubscriptions",
  dateWritten: "2024-06-04",
  idempotent: true,
  action: async () => {
    const adminContext = createAdminContext();
    const { Subscriptions } = adminContext;

    const subscriptions = await Subscriptions.find({
      collectionName: 'Users',
      type: { $in: ['newPosts', 'newUserComments']
    } }).fetch();

    const currentSubscriptionStates = new Map<string, DbSubscription>();

    // Get the most recent subscription record for each (userId, type, documentId) tuple
    subscriptions.forEach(sub => {
      const key = `${sub.userId}-${sub.type}-${sub.documentId}`;
      const existingSub = currentSubscriptionStates.get(key);
  
      if (!existingSub || existingSub.createdAt < sub.createdAt) {
        currentSubscriptionStates.set(key, sub);
      }
    });

    // Use only those most-recent subscriptions which are "active"
    const activeSubscriptions = Array.from(currentSubscriptionStates.values()).filter(({ state, deleted }) => !deleted && state === 'subscribed');

    const subscriptionsByType = groupBy(activeSubscriptions, ({ type }) => type);

    const postAndCommentSubscriptions = uniq([...subscriptionsByType['newPosts'], ...subscriptionsByType['newUserComments']].map(({ userId, documentId }) => ({ userId, documentId })));

    const now = new Date();

    const bulkWriteOperations = postAndCommentSubscriptions.map(({ userId, documentId }) => ({
      insertOne: {
        document: {
          _id: randomId(),
          collectionName: 'Users',
          type: 'newActivityForFeed',
          state: 'subscribed',
          deleted: false,
          userId,
          documentId,
          createdAt: now,
          schemaVersion: 1,
          legacyData: null,
        }
      }
    } as const));

    const writeOperationsById = groupBy(bulkWriteOperations, ({ insertOne: { document: { userId } } }) => userId);

    for (const batch of chunkWithoutSplitting(writeOperationsById, 1000)) {
      await Subscriptions.rawCollection().bulkWrite(batch);
    }
  },
});
