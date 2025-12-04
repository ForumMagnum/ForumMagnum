/**
 * Score-based ranking algorithm for UltraFeed
 * 
 * This algorithm:
 * 1) Computes explicit scores for each item based on multiple factors (karma, recency, engagement, etc.)
 * 2) Applies diversity constraints during greedy selection
 * 3) Provides transparency via user-facing score breakdowns
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

