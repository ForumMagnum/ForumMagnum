/**
 * @file ultraFeedSettingsTypes.ts
 * This file defines the UltraFeed settings types and default values.
 */
import { FeedItemSourceType } from './ultraFeedTypes';

export interface UltraFeedResolverSettings {
  sourceWeights: Record<FeedItemSourceType, number>;
  commentDecayFactor: number;
  commentDecayBiasHours: number;
  ultraFeedSeenPenalty: number;
  quickTakeBoost: number;
  commentSubscribedAuthorMultiplier: number;
  threadScoreAggregation: 'sum' | 'max' | 'logSum' | 'avg';
  threadScoreFirstN: number;
  incognitoMode: boolean;
  // Thread Engagement Boost Settings
  threadVotePowerWeight: number;
  threadParticipationWeight: number;
  threadViewScoreWeight: number;
  threadOnReadPostWeight: number;
}

export interface UltraFeedDisplaySettings {
  postTruncationBreakpoints: (number | null)[];
  lineClampNumberOfLines: number;
  commentTruncationBreakpoints: (number | null)[];
  postTitlesAreModals: boolean;
}

interface DefaultUltraFeedDisplaySettings {
  postTruncationBreakpoints: (number | null)[];
  lineClampNumberOfLines: number;
  commentTruncationBreakpoints: (number | null)[];
  postTitlesAreModals: boolean;
}

export type UltraFeedSettingsType = UltraFeedResolverSettings & UltraFeedDisplaySettings;

type UltraFeedDefaultSettingsType = UltraFeedResolverSettings & DefaultUltraFeedDisplaySettings;
export interface UltraFeedStoredSettings extends UltraFeedSettingsType {
   viewMode?: 'simple' | 'advanced';
}

export const getResolverSettings = (settings: UltraFeedSettingsType): UltraFeedResolverSettings => ({
  sourceWeights: settings.sourceWeights,
  commentDecayFactor: settings.commentDecayFactor,
  commentDecayBiasHours: settings.commentDecayBiasHours,
  ultraFeedSeenPenalty: settings.ultraFeedSeenPenalty,
  quickTakeBoost: settings.quickTakeBoost,
  commentSubscribedAuthorMultiplier: settings.commentSubscribedAuthorMultiplier,
  threadScoreAggregation: settings.threadScoreAggregation,
  threadScoreFirstN: settings.threadScoreFirstN,
  incognitoMode: settings.incognitoMode,
  // Thread Engagement Boost Settings
  threadVotePowerWeight: settings.threadVotePowerWeight,
  threadParticipationWeight: settings.threadParticipationWeight,
  threadViewScoreWeight: settings.threadViewScoreWeight,
  threadOnReadPostWeight: settings.threadOnReadPostWeight,
});

export const getDisplaySettings = (settings: UltraFeedSettingsType): UltraFeedDisplaySettings => ({
  postTruncationBreakpoints: settings.postTruncationBreakpoints,
  lineClampNumberOfLines: settings.lineClampNumberOfLines,
  commentTruncationBreakpoints: settings.commentTruncationBreakpoints,
  postTitlesAreModals: settings.postTitlesAreModals,
}); 

export interface SourceWeightConfig {
  key: FeedItemSourceType;
  label: string;
  description: string;
}

export const sourceWeightConfigs: SourceWeightConfig[] = [
  {
    key: 'recentComments',
    label: "Recent Comments",
    description: "Tailored for you based on interaction history, includes Quick Takes."
  },
  {
    key: 'recombee-lesswrong-custom',
    label: "Personalized Post Recs",
    description: "Tailored for you based on your reading and voting history."
  },
  {
    key: 'hacker-news',
    label: "Latest Posts",
    description: "Prioritized by karma and your personalized frontpage settings."
  },
  {
    key: 'spotlights',
    label: "Featured Items",
    description: "Manually curated items highlighted by moderators or editors."
  },
  {
    key: 'bookmarks',
    label: "Your Bookmarks",
    description: "Items you've bookmarked will be included to remind you about them."
  },
  {
    key: 'subscriptions',
    label: "Posts by Followed Users",
    description: "Posts from users you've subscribed to or followed (for subscribed comments config, see Advanced Settings)."
  },
];

export const DEFAULT_SOURCE_WEIGHTS: Record<FeedItemSourceType, number> = {
  'recombee-lesswrong-custom': 30,
  'hacker-news': 30,
  'recentComments': 60,
  'spotlights': 10,
  'bookmarks': 10,
  'subscriptions': 10,
};

export const DEFAULT_SETTINGS: UltraFeedDefaultSettingsType = {
  // Display Settings Defaults
  postTruncationBreakpoints: [200, 2000],
  lineClampNumberOfLines: 2,
  commentTruncationBreakpoints: [50, 200, 1000],
  postTitlesAreModals: true,

  // Resolver Settings Defaults
  sourceWeights: DEFAULT_SOURCE_WEIGHTS,
  commentDecayFactor: 1.8, 
  commentDecayBiasHours: 2, 
  ultraFeedSeenPenalty: 0.1, 
  quickTakeBoost: 1.5, 
  commentSubscribedAuthorMultiplier: 2,
  threadScoreAggregation: 'logSum', 
  threadScoreFirstN: 5, 
  incognitoMode: false, 
  // Thread Engagement Boost Settings Defaults
  threadVotePowerWeight: 0.1,
  threadParticipationWeight: 0.2,
  threadViewScoreWeight: 0.05,
  threadOnReadPostWeight: 0.15,
};

export const truncationLevels = ['Very Short', 'Short', 'Medium', 'Long', 'Full', 'Unset'] as const;
export type TruncationLevel = typeof truncationLevels[number];

export const levelToCommentLinesMap: Record<TruncationLevel, number> = {
  'Very Short': 2, // Only this sets a line clamp
  'Short': 0,      // Others disable line clamp
  'Medium': 0,
  'Long': 0,
  'Full': 0,
  'Unset': 0,
};

export const levelToCommentBreakpointMap: Record<TruncationLevel, number | null | undefined> = {
  'Very Short': 50,
  'Short': 100,
  'Medium': 200,
  'Long': 1000,
  'Full': null,       // explicit "show all"
  'Unset': undefined  // not present
};

export const levelToPostBreakpointMap: Record<TruncationLevel, number | null | undefined> = {
  'Very Short': 50,
  'Short': 100,
  'Medium': 200,
  'Long': 2000,
  'Full': null,       // explicit "show all"
  'Unset': undefined  // not present
};

export const getCommentBreakpointLevel = (breakpoint: number | null | undefined): TruncationLevel => {
  if (breakpoint === null) return 'Full';
  if (breakpoint === undefined) return 'Unset';
  if (breakpoint <= 0) return 'Full';

  let closestLevel: TruncationLevel = 'Very Short';
  let minDiff = Infinity;
  for (const level of truncationLevels) {
    if (level === 'Full' || level === 'Unset') continue;
    const mapVal = levelToCommentBreakpointMap[level]; // Use comment map
    if (mapVal === undefined || mapVal === null) continue;
    const diff = Math.abs(mapVal - breakpoint);
     if (diff < minDiff) {
       minDiff = diff;
       closestLevel = level;
     } else if (diff === minDiff && levelToCommentBreakpointMap[level]! > levelToCommentBreakpointMap[closestLevel]!) {
       closestLevel = level;
    }
  }
  return closestLevel;
};

export const getFirstCommentLevel = (lines: number, breakpoint: number | null | undefined): TruncationLevel => {
  if (lines === 2) {
    return 'Very Short';
  }
  return getCommentBreakpointLevel(breakpoint);
};

export const getPostBreakpointLevel = (breakpoint: number | null | undefined): TruncationLevel => {
  if (breakpoint === null) return 'Full';
  if (breakpoint === undefined) return 'Unset';
  if (breakpoint <= 0) return 'Full';

  let closestLevel: TruncationLevel = 'Very Short';
  let minDiff = Infinity;
  for (const level of truncationLevels) {
    if (level === 'Full' || level === 'Unset') continue;
    const mapVal = levelToPostBreakpointMap[level]; // Use post map
    if (mapVal === undefined || mapVal === null) continue;
    const diff = Math.abs(mapVal - breakpoint);
    if (diff < minDiff) {
       minDiff = diff;
       closestLevel = level;
     } else if (diff === minDiff && levelToPostBreakpointMap[level]! > levelToPostBreakpointMap[closestLevel]!) {
       closestLevel = level;
    }
  }
  return closestLevel;
};

export interface SettingsFormState {
  sourceWeights: Record<FeedItemSourceType, number | ''>;
  postLevel0: TruncationLevel;
  postLevel1: TruncationLevel;
  postLevel2: TruncationLevel;
  commentLevel0: TruncationLevel;
  commentLevel1: TruncationLevel;
  commentLevel2: TruncationLevel;
  incognitoMode: boolean;
  quickTakeBoost: number;
  commentSubscribedAuthorMultiplier: number | '';
  // Advanced truncation settings
  lineClampNumberOfLines: number | '';
  postBreakpoints: (number | null | '')[];
  commentBreakpoints: (number | null | '')[];
  // Misc settings
  ultraFeedSeenPenalty: number | '';
  postTitlesAreModals: boolean;
  threadVotePowerWeight: number | '';
  threadParticipationWeight: number | '';
  threadViewScoreWeight: number | '';
  threadOnReadPostWeight: number | '';
}

export interface SettingsFormErrors {
  sourceWeights: Record<FeedItemSourceType, boolean>;
  postLevel0?: boolean;
  postLevel1?: boolean;
  postLevel2?: boolean;
  commentLevel0?: boolean;
  commentLevel1?: boolean;
  commentLevel2?: boolean;
  quickTakeBoost?: boolean;
  // Advanced truncation errors
  lineClampNumberOfLines?: boolean;
  postBreakpoints?: boolean;
  commentBreakpoints?: boolean;
  // Misc errors
  ultraFeedSeenPenalty?: boolean;
}

export type TruncationGridFields = 'postLevel0' | 'postLevel1' | 'postLevel2' | 'commentLevel0' | 'commentLevel1' | 'commentLevel2';


export const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings';
