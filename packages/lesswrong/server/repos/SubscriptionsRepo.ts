import Subscriptions from '../../server/collections/subscriptions/collection';
import AbstractRepo from './AbstractRepo';
import { recordPerfMetrics } from './perfMetricWrapper';

class SubscriptionsRepo extends AbstractRepo<"Subscriptions"> {
  constructor() {
    super(Subscriptions);
  }

  /**
   * Fetches the IDs of users to whom the given user is subscribed.
   */
  async getSubscribedToUserIds(currentUserId: string): Promise<string[]> {
    const results = await this.getRawDb().manyOrNone<{
      userId: string;
    }>(
      `
      -- SubscriptionsRepo.getSubscribedToUserIds
      SELECT DISTINCT "documentId" AS "userId"
      FROM "Subscriptions" s
      WHERE s.state = 'subscribed'
        AND s.deleted IS NOT TRUE
        AND s."collectionName" = 'Users'
        AND s."type" IN ('newActivityForFeed', 'newPosts', 'newComments')
        AND s."userId" = $(currentUserId)
    `,
      {
        currentUserId,
      }
    );
    return results.map((r) => r.userId);
  }
}

recordPerfMetrics(SubscriptionsRepo);

export default SubscriptionsRepo; 
