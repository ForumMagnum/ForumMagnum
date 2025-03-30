export async function deleteOldSubscriptions(subscription: Partial<DbInsertion<DbSubscription>>, context: ResolverContext) {
  const { Subscriptions } = context;
  const { userId, documentId, collectionName, type } = subscription
  await Subscriptions.rawUpdateMany({userId, documentId, collectionName, type}, {$set: {deleted: true}}, {multi: true})
  return subscription;
}
