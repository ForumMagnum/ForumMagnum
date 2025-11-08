/**
 * Score-based ranking algorithm for UltraFeed (new algorithm)
 * 
 * This algorithm:
 * - Computes explicit scores for each item based on multiple signals (karma, recency, engagement, etc.)
 * - Applies diversity constraints during greedy selection
 * - Provides transparency via score breakdowns
 * 
 */

import type { UltraFeedAlgorithm } from '../ultraFeedAlgorithmInterface';
import type { RankableItem, RankedItemMetadata } from '../ultraFeedRankingTypes';
import type { UltraFeedResolverSettings } from '@/components/ultraFeed/ultraFeedSettingsTypes';
import { rankUltraFeedItems } from '../ultraFeedRanking';
import { buildRankingConfigFromSettings } from '../ultraFeedRankingConfig';

export const scoringAlgorithm: UltraFeedAlgorithm = {
  name: 'scoring',
  
  rankItems(
    items: RankableItem[],
    totalItems: number,
    settings: UltraFeedResolverSettings
  ): Array<{ id: string; metadata?: RankedItemMetadata }> {
    const config = buildRankingConfigFromSettings(settings.unifiedScoring);
    
    return rankUltraFeedItems(items, totalItems, config);
  },
};

