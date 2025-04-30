/**
 * @file ultraFeedSettingsTypes.ts
 * This file defines the UltraFeed settings types and default values.
 */
import { FeedItemSourceType } from './ultraFeedTypes';

// Settings sent to the server to influence content/scoring
export interface UltraFeedResolverSettings {
  sourceWeights: Record<FeedItemSourceType, number>;
  commentDecayFactor: number;
  commentDecayBiasHours: number;
  ultraFeedSeenPenalty: number;
  quickTakeBoost: number;
  threadScoreAggregation: 'sum' | 'max' | 'logSum' | 'avg';
  threadScoreFirstN: number;
  incognitoMode: boolean; // Sent to server, but change doesn't require immediate refetch
}

// Settings used only by the client for display adjustments
export interface UltraFeedDisplaySettings {
  postTruncationBreakpoints: (number | null)[];
  lineClampNumberOfLines: number; // For comments
  commentTruncationBreakpoints: (number | null)[];
  postTitlesAreModals: boolean;
}

// Combined type (used for storage and the settings component prop)
export type UltraFeedSettingsType = UltraFeedResolverSettings & UltraFeedDisplaySettings;

// Type for storing view mode preference along with settings
export interface UltraFeedStoredSettings extends UltraFeedSettingsType {
   viewMode?: 'simple' | 'advanced';
}

// Default source weights
export const DEFAULT_SOURCE_WEIGHTS: Record<FeedItemSourceType, number> = {
  'recombee-lesswrong-custom': 30,
  'hacker-news': 30,
  'recentComments': 60,
  'spotlights': 10,
  'bookmarks': 10,
};

// Combined default settings
export const DEFAULT_SETTINGS: UltraFeedSettingsType = {
  // Display Settings Defaults
  postTruncationBreakpoints: [300, 2000],
  lineClampNumberOfLines: 2,
  commentTruncationBreakpoints: [50, 200, 1000],
  postTitlesAreModals: true,

  // Resolver Settings Defaults
  sourceWeights: DEFAULT_SOURCE_WEIGHTS,
  commentDecayFactor: 1.8, // HN default
  commentDecayBiasHours: 2, // HN default
  ultraFeedSeenPenalty: 0.6, // Reduce score to 60% if seen
  quickTakeBoost: 1.5, // Give shortform comments a 50% score boost
  threadScoreAggregation: 'logSum', // Default aggregation method
  threadScoreFirstN: 5, // Use top 5 comments for thread score
  incognitoMode: false, // Default to recording history
};

export const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings';

// Helper function to extract resolver settings
export const getResolverSettings = (settings: UltraFeedSettingsType): UltraFeedResolverSettings => ({
  sourceWeights: settings.sourceWeights,
  commentDecayFactor: settings.commentDecayFactor,
  commentDecayBiasHours: settings.commentDecayBiasHours,
  ultraFeedSeenPenalty: settings.ultraFeedSeenPenalty,
  quickTakeBoost: settings.quickTakeBoost,
  threadScoreAggregation: settings.threadScoreAggregation,
  threadScoreFirstN: settings.threadScoreFirstN,
  incognitoMode: settings.incognitoMode,
});

// Helper function to extract client display settings
export const getDisplaySettings = (settings: UltraFeedSettingsType): UltraFeedDisplaySettings => ({
  postTruncationBreakpoints: settings.postTruncationBreakpoints,
  lineClampNumberOfLines: settings.lineClampNumberOfLines,
  commentTruncationBreakpoints: settings.commentTruncationBreakpoints,
  postTitlesAreModals: settings.postTitlesAreModals,
}); 
