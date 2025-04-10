/**
 * @file ultraFeedSettingsTypes.ts
 * This file defines the UltraFeed settings types and default values.
 */
import { FeedItemSourceType } from './ultraFeedTypes';

export interface UltraFeedSettingsType {
  postTruncationBreakpoints: number[];
  commentTruncationBreakpoints: number[];
  collapsedCommentTruncation: number;
  lineClampNumberOfLines: number;
  sourceWeights: Record<FeedItemSourceType, number>;
}

// Default source weights (matching the original resolver weights)
export const DEFAULT_SOURCE_WEIGHTS: Record<FeedItemSourceType, number> = {
  'recombee-lesswrong-custom': 10,
  'hacker-news': 10,
  'quickTakes': 20,
  'topComments': 20,
  'spotlights': 2,
  'curated': 0,
  'stickied': 0, // Stickied posts probably shouldn't have weight affecting sampling
  'welcome-post': 0,
};

export const DEFAULT_SETTINGS: UltraFeedSettingsType = {
  postTruncationBreakpoints: [100, 500, 1000],
  commentTruncationBreakpoints: [50, 300, 600],
  collapsedCommentTruncation: 50,
  lineClampNumberOfLines: 2,
  sourceWeights: { ...DEFAULT_SOURCE_WEIGHTS },
};

// Constants for localStorage
export const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings'; 