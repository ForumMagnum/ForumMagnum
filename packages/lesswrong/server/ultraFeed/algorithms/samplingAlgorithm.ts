/**
 * Weighted sampling algorithm for UltraFeed (original algorithm)
 * 
 * This algorithm:
 * - Uses weighted random sampling based on source weights
 * - Does not compute explicit scores for items
 * - Provides simpler, more random-feeling feed experience
 * 
 * This is the legacy algorithm kept for comparison and user preference.
 */

import type { UltraFeedAlgorithm } from '../ultraFeedAlgorithmInterface';
import type { RankableItem, RankedItemMetadata } from '../ultraFeedRankingTypes';
import type { UltraFeedResolverSettings } from '@/components/ultraFeed/ultraFeedSettingsTypes';

/**
 * Sample items using weighted random selection.
 * Each source type has a weight, and we sample proportionally to those weights.
 */
function weightedSample<T>(
  items: T[],
  weights: number[],
  count: number
): T[] {
  if (items.length === 0 || count === 0) return [];
  if (items.length <= count) return [...items];
  
  const result: T[] = [];
  const available = items.map((item, i) => ({ item, weight: weights[i] ?? 1 }));
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const totalWeight = available.reduce((sum, a) => sum + a.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedIndex = 0;
    for (let j = 0; j < available.length; j++) {
      random -= available[j].weight;
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }
    
    result.push(available[selectedIndex].item);
    available.splice(selectedIndex, 1);
  }
  
  return result;
}

/**
 * Get a simple weight for an item based on its sources.
 * Items from multiple sources get boosted weight.
 */
function getItemWeight(item: RankableItem): number {
  const sourceCount = item.sources?.length ?? 1;
  
  // Base weight of 1, boost for items that appear in multiple sources
  const baseWeight = 1;
  const sourceBonus = (sourceCount - 1) * 0.5;
  
  // Small boost for unread items
  const unreadBonus = !item.isRead ? 0.2 : 0;
  
  return baseWeight + sourceBonus + unreadBonus;
}

export const samplingAlgorithm: UltraFeedAlgorithm = {
  name: 'sampling',
  
  rankItems(
    items: RankableItem[],
    totalItems: number,
    settings: UltraFeedResolverSettings
  ): Array<{ id: string; metadata: RankedItemMetadata }> {
    // Use simple weighted random sampling based on item properties
    // (sourceWeights are used upstream to determine which items are fetched)
    const weights = items.map(item => getItemWeight(item));
    
    const sampledItems = weightedSample(items, weights, totalItems);
    
    // Return with minimal metadata (no scores since this algorithm doesn't compute them)
    return sampledItems.map((item, index) => {
      // All items get PostScoreBreakdown in sampling (even threads use the simpler breakdown)
      const metadata: RankedItemMetadata = item.itemType === 'commentThread'
        ? {
            rankedItemType: 'commentThread' as const,
            scoreBreakdown: {
              total: 1,
              components: {
                startingValue: 1,
                unreadSubscribedCommentBonus: 0,
                engagementContinuationBonus: 0,
                repliesToYouBonus: 0,
                yourPostActivityBonus: 0,
                overallKarmaBonus: 0,
                topicAffinityBonus: 0,
                quicktakeBonus: 0,
                readPostContextBonus: 0,
              },
              repetitionPenaltyMultiplier: 1,
            },
            selectionConstraints: ['weighted-sampling'],
            position: index,
          }
        : {
            rankedItemType: 'post' as const,
            scoreBreakdown: {
              total: 1,
              components: {
                startingValue: 1,
                subscribedBonus: 0,
                karmaBonus: 0,
                topicAffinityBonus: 0,
              },
            },
            selectionConstraints: ['weighted-sampling'],
            position: index,
          };
      
      return { id: item.id, metadata };
    });
  },
};

