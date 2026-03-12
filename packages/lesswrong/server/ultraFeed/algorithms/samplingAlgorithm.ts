/**
 * Weighted sampling algorithm for UltraFeed (original algorithm)
 * This algorithm uses source-based weighted random sampling: items are grouped by source,
 * and sources are sampled proportionally to their configured weights.
 */

import type { UltraFeedAlgorithm } from '../ultraFeedAlgorithmInterface';
import type { RankableItem, RankedItemMetadata } from '../ultraFeedRankingTypes';
import type { UltraFeedResolverSettings } from '@/components/ultraFeed/ultraFeedSettingsTypes';
import type { FeedItemSourceType } from '@/components/ultraFeed/ultraFeedTypes';

interface SourceBucket {
  weight: number;
  items: RankableItem[];
}

function weightedSampleBySources(
  sourceBuckets: Partial<Record<FeedItemSourceType, SourceBucket>>,
  totalItems: number
): RankableItem[] {
  const result: RankableItem[] = [];
  
  const buckets = { ...sourceBuckets };
  
  let totalWeight = Object.values(buckets)
    .reduce((sum, bucket) => sum + (bucket && bucket.items.length > 0 ? bucket.weight : 0), 0);
  
  for (let i = 0; i < totalItems; i++) {
    if (totalWeight <= 0) break;
    
    const pick = Math.random() * totalWeight;
    let cumulative = 0;
    let chosenSource: FeedItemSourceType | null = null;
    
    for (const [source, bucket] of Object.entries(buckets)) {
      if (!bucket || bucket.items.length === 0) continue;
      cumulative += bucket.weight;
      if (pick < cumulative) {
        chosenSource = source as FeedItemSourceType;
        break;
      }
    }
    
    if (chosenSource && buckets[chosenSource]) {
      const bucket = buckets[chosenSource]!;
      const item = bucket.items.shift();
      if (item) {
        result.push(item);
      }
      
      if (bucket.items.length === 0) {
        totalWeight -= bucket.weight;
      }
    }
  }
  
  return result;
}

/**
 * Group items by their source types, creating a bucket for each source.
 * Items that appear in multiple sources will be added to each of their source buckets.
 */
function groupItemsBySources(
  items: RankableItem[],
  sourceWeights: Record<string, number>
): Partial<Record<FeedItemSourceType, SourceBucket>> {
  const buckets: Partial<Record<FeedItemSourceType, SourceBucket>> = {};
  
  for (const [source, weight] of Object.entries(sourceWeights)) {
    if (weight > 0) {
      buckets[source as FeedItemSourceType] = {
        weight,
        items: []
      };
    }
  }
  
  const addedToSource = new Map<FeedItemSourceType, Set<string>>();
  
  for (const item of items) {
    const sources = item.sources ?? [];
    for (const source of sources) {
      const bucket = buckets[source];
      if (bucket) {
        if (!addedToSource.has(source)) {
          addedToSource.set(source, new Set());
        }
        const sourceSet = addedToSource.get(source)!;
        if (!sourceSet.has(item.id)) {
          bucket.items.push(item);
          sourceSet.add(item.id);
        }
      }
    }
  }
  
  return buckets;
}

export const samplingAlgorithm: UltraFeedAlgorithm = {
  name: 'sampling',
  
  rankItems(
    items: RankableItem[],
    totalItems: number,
    settings: UltraFeedResolverSettings
  ): Array<{ id: string; metadata?: RankedItemMetadata }> {
    const sourceBuckets = groupItemsBySources(items, settings.sourceWeights);
    const sampledItems = weightedSampleBySources(sourceBuckets, totalItems);
    
    return sampledItems.map((item) => {
      return { id: item.id };
    });
  },
};

