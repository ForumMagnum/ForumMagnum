/**
 * @file ultraFeedSettingsTypes.ts
 * This file defines the UltraFeed settings types and default values.
 */
import { FeedItemSourceType } from './ultraFeedTypes';

export interface UltraFeedSettingsType {
  collapsedCommentTruncation: number;
  lineClampNumberOfLines: number;
  postTruncationBreakpoints: number[];
  commentTruncationBreakpoints: number[];
  sourceWeights: Record<FeedItemSourceType, number>;
  commentDecayFactor: number;
  commentDecayBiasHours: number;
  commentSeenPenalty: number;
  quickTakeBoost: number;
}

export const DEFAULT_SOURCE_WEIGHTS: Record<FeedItemSourceType, number> = {
  'hacker-news': 5,
  'recombee-lesswrong-custom': 5,
  'spotlights': 2,
  'recentComments': 10,
  'curated': 0,
  'stickied': 0,
  'welcome-post': 0,
};

export const DEFAULT_SETTINGS: UltraFeedSettingsType = {
  collapsedCommentTruncation: 70,
  lineClampNumberOfLines: 0,
  postTruncationBreakpoints: [70, 250],
  commentTruncationBreakpoints: [100, 250],
  sourceWeights: DEFAULT_SOURCE_WEIGHTS,
  commentDecayFactor: 1.8, 
  commentDecayBiasHours: 2, 
  commentSeenPenalty: 0.6,
  quickTakeBoost: 1.5,
};

export const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings'; 
