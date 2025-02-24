import { registerFragment } from '../../vulcan-lib/fragments';

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

registerFragment(`
  fragment MembersOfGroupFragment on Subscription {
    user {
      ...UsersMinimumInfo
    }
  }
`);
