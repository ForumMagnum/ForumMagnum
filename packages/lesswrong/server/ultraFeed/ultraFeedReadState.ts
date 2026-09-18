/** SQL expressions supplied here must be trusted identifiers/parameters, never user input. */
export function ultraFeedReadIsCurrentSql(userId: string, documentId: string, timestamp: string): string {
  return `NOT EXISTS (
    SELECT 1 FROM "UltraFeedEvents" unread
    WHERE unread."userId" = ${userId}
      AND unread."collectionName" = 'Posts'
      AND unread."documentId" = ${documentId}
      AND unread."eventType" = 'interacted'
      AND unread.event->>'action' = 'markUnread'
      AND unread."createdAt" >= ${timestamp}
  )`;
}
