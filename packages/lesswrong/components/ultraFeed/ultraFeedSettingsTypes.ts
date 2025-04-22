/**
 * @file ultraFeedSettingsTypes.ts
 * This file defines the UltraFeed settings types and default values.
 */
import { FeedItemSourceType } from './ultraFeedTypes';

export interface UltraFeedSettingsType {
  lineClampNumberOfLines: number;
  postTruncationBreakpoints: number[];
  commentTruncationBreakpoints: number[];
  sourceWeights: Record<FeedItemSourceType, number>;
  commentDecayFactor: number;
  commentDecayBiasHours: number;
  ultraFeedSeenPenalty: number;
  quickTakeBoost: number;
  incognitoMode: boolean;
  threadScoreAggregation: 'sum' | 'max' | 'logSum' | 'avg';
  threadScoreFirstN: number;
}

export const DEFAULT_SOURCE_WEIGHTS: Record<FeedItemSourceType, number> = {
  'hacker-news': 10,
  'recombee-lesswrong-custom': 10,
  'bookmarks': 2,
  'recentComments': 20,
  'spotlights': 1,
};

export const DEFAULT_SETTINGS: UltraFeedSettingsType = {
  sourceWeights: DEFAULT_SOURCE_WEIGHTS,
  lineClampNumberOfLines: 3,
  postTruncationBreakpoints: [100, 500, 2000],
  commentTruncationBreakpoints: [75, 500, 2000],
  commentDecayFactor: 1.8,
  commentDecayBiasHours: 2,
  ultraFeedSeenPenalty: 0.6,
  quickTakeBoost: 1.5,
  incognitoMode: false,
  threadScoreAggregation: 'logSum',
  threadScoreFirstN: 5,
};

export const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings'; 
