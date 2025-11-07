/**
 * Interface for UltraFeed ranking algorithms.
 * 
 * This allows us to swap between different ranking implementations while maintaining
 * a consistent interface for the resolver.
 */

import type { RankableItem, RankedItemMetadata } from './ultraFeedRankingTypes';
import type { UltraFeedResolverSettings } from '@/components/ultraFeed/ultraFeedSettingsTypes';

export interface UltraFeedAlgorithm {
  /**
   * Name/identifier for this algorithm
   */
  name: string;
  
  /**
   * Rank a list of items and return them in ranked order with metadata.
   * 
   * @param items - The items to rank (posts, threads, spotlights, bookmarks)
   * @param totalItems - Maximum number of items to return
   * @param settings - User settings for ranking (includes sourceWeights, unifiedScoring, etc.)
   * @returns Array of ranked item IDs with their ranking metadata
   */
  rankItems(
    items: RankableItem[],
    totalItems: number,
    settings: UltraFeedResolverSettings
  ): Array<{ id: string; metadata: RankedItemMetadata }>;
}

