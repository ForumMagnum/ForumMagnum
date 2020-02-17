import { addCallback } from '../../lib/vulcan-lib';
import { Subscriptions } from '../../lib/collections/subscriptions/collection'

async function deleteOldSubscriptions(subscription) {
  const { userId, documentId, collectionName, type } = subscription
  Subscriptions.update({userId, documentId, collectionName, type}, {$set: {deleted: true}}, {multi: true})
  return subscription;
}

addCallback("subscription.create.before", deleteOldSubscriptions);
