/**
 * @file ultraFeedSettingsTypes.ts
 * This file defines the UltraFeed settings types and default values.
 */

export interface UltraFeedSettingsType {
  postTruncationBreakpoints: number[];
  commentTruncationBreakpoints: number[];
  collapsedCommentTruncation: number;
  lineClampNumberOfLines: number;
}

export const DEFAULT_SETTINGS: UltraFeedSettingsType = {
  postTruncationBreakpoints: [100, 500, 1000],
  commentTruncationBreakpoints: [50, 300, 600],
  collapsedCommentTruncation: 50,
  lineClampNumberOfLines: 2,
};

// Constants for localStorage
export const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings'; 