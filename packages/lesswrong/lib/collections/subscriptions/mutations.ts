import { subscriptionTypes } from './schema'

export const defaultSubscriptionTypeTable = {
  "Comments": subscriptionTypes.newReplies,
  "Posts": subscriptionTypes.newComments,
  "Users": subscriptionTypes.newPosts,
  "Localgroups": subscriptionTypes.newEvents,
  "Tags": subscriptionTypes.newTagPosts,
  "Sequences": subscriptionTypes.newSequencePosts,
  // TODO: other subscription types?
}

export type DefaultSubscriptionType = keyof typeof defaultSubscriptionTypeTable;

export const isDefaultSubscriptionType =
  (value: string): value is DefaultSubscriptionType =>
    value in defaultSubscriptionTypeTable;
