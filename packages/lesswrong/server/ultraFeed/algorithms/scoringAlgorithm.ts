/**
 * Score-based ranking algorithm for UltraFeed (new algorithm)
 * 
 * This algorithm:
 * - Computes explicit scores for each item based on multiple signals (karma, recency, engagement, etc.)
 * - Applies diversity constraints during greedy selection
 * - Provides transparency via score breakdowns
 * 
 * See ULTRAFEED_RANKING_SYSTEM.md for detailed documentation.
 */

import type { UltraFeedAlgorithm } from '../ultraFeedAlgorithmInterface';
import type { RankableItem, RankedItemMetadata } from '../ultraFeedRankingTypes';
import { rankUltraFeedItems } from '../ultraFeedRanking';

export const scoringAlgorithm: UltraFeedAlgorithm = {
  name: 'scoring',
  
  rankItems(
    items: RankableItem[],
    totalItems: number,
    userTagAffinity?: Map<string, number> | null
  ): Array<{ id: string; metadata: RankedItemMetadata }> {
    return rankUltraFeedItems(items, totalItems, userTagAffinity);
  },
};

