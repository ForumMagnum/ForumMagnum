export async function deleteOldSubscriptions(subscription: CreateSubscriptionDataInput & { userId?: string }, context: ResolverContext) {
  const { Subscriptions } = context;
  const { userId, documentId, collectionName, type } = subscription
  await Subscriptions.rawUpdateMany({userId, documentId, collectionName, type}, {$set: {deleted: true}}, {multi: true})
  return subscription;
}
