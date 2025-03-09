import { Subscriptions } from '../../server/collections/subscriptions/collection'
import { getCollectionHooks } from '../mutationCallbacks';

getCollectionHooks("Subscriptions").createBefore.add(async function deleteOldSubscriptions(subscription) {
  const { userId, documentId, collectionName, type } = subscription
  await Subscriptions.rawUpdateMany({userId, documentId, collectionName, type}, {$set: {deleted: true}}, {multi: true})
  return subscription;
});
