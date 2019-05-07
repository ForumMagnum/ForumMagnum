import { addCallback } from 'meteor/vulcan:core';
import { Subscriptions } from './collection'

async function deleteOldSubscriptions(subscription) {
  const { userId, documentId, collectionName, type } = subscription
  Subscriptions.update({userId, documentId, collectionName, type}, {$set: {deleted: true}}, {multi: true})
}

addCallback("subscription.create.async", deleteOldSubscriptions);