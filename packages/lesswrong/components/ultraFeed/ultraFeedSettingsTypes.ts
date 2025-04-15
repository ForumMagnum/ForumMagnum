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
  incognitoMode: boolean;
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
  sourceWeights: DEFAULT_SOURCE_WEIGHTS,
  collapsedCommentTruncation: 50,
  lineClampNumberOfLines: 2,
  postTruncationBreakpoints: [50, 200, 5000],
  commentTruncationBreakpoints: [200, 1000],
  commentDecayFactor: 1.8,
  commentDecayBiasHours: 2,
  commentSeenPenalty: 0.6,
  quickTakeBoost: 1.5,
  incognitoMode: false,
};

export const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings'; 
