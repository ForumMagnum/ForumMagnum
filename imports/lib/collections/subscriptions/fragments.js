import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment SubscriptionState on Subscription {
    _id
    userId
    createdAt
    state
    documentId
    collectionName
    deleted
    type
  }
`);
