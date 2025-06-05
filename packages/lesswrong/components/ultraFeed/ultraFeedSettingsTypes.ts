/**
 * @file ultraFeedSettingsTypes.ts
 * This file defines the UltraFeed settings types and default values.
 */
import { FeedItemSourceType } from './ultraFeedTypes';
import { ZodFormattedError } from 'zod';


export interface UltraFeedDisplaySettings {
  postTruncationBreakpoints: number[];
  lineClampNumberOfLines: number;
  commentTruncationBreakpoints: number[];
  postTitlesAreModals: boolean;
}

export interface UltraFeedResolverSettings {
  incognitoMode: boolean;
  sourceWeights: Record<FeedItemSourceType, number>;
  threadInterestModel: ThreadInterestModelSettings;
  commentScoring: CommentScoringSettings;
}

export interface UltraFeedSettingsType {
  displaySettings: UltraFeedDisplaySettings;
  resolverSettings: UltraFeedResolverSettings;
}

const DEFAULT_DISPLAY_SETTINGS: UltraFeedDisplaySettings = {
  postTruncationBreakpoints: [200, 2000],
  lineClampNumberOfLines: 0,
  commentTruncationBreakpoints: [50, 200, 1000],
  postTitlesAreModals: true,
};

export const SHOW_ALL_BREAKPOINT_VALUE = 100_000;

export const DEFAULT_SOURCE_WEIGHTS: Record<FeedItemSourceType, number> = {
  'recentComments': 80,
  'recombee-lesswrong-custom': 30,
  'hacker-news': 30,
  'spotlights': 5,
  'bookmarks': 1,
  'subscriptions': 20,
};
export interface CommentScoringSettings {
  commentDecayFactor: number;
  commentDecayBiasHours: number;
  ultraFeedSeenPenalty: number;
  quickTakeBoost: number;
  commentSubscribedAuthorMultiplier: number;
  threadScoreAggregation: 'sum' | 'max' | 'logSum' | 'avg';
  threadScoreFirstN: number;
}

const DEFAULT_COMMENT_SCORING_SETTINGS: CommentScoringSettings = {
  commentDecayFactor: 1.8,
  commentDecayBiasHours: 2,
  ultraFeedSeenPenalty: 0.05,
  quickTakeBoost: 1.5,
  commentSubscribedAuthorMultiplier: 2,
  threadScoreAggregation: 'logSum',
  threadScoreFirstN: 5,
};
export interface ThreadInterestModelSettings {
  commentCoeff: number;
  voteCoeff: number;
  viewCoeff: number;
  onReadPostFactor: number;
  logImpactFactor: number;
  minOverallMultiplier: number;
  maxOverallMultiplier: number;
}

const DEFAULT_THREAD_INTEREST_MODEL_SETTINGS: ThreadInterestModelSettings = {
  commentCoeff: 5,
  voteCoeff: 2,
  viewCoeff: 1,
  onReadPostFactor: 1.1,
  logImpactFactor: 0.5,
  minOverallMultiplier: 0.5,
  maxOverallMultiplier: 20.0,
};

export const DEFAULT_SETTINGS: UltraFeedSettingsType = {
  displaySettings: DEFAULT_DISPLAY_SETTINGS,
  resolverSettings: {
    incognitoMode: false,
    sourceWeights: DEFAULT_SOURCE_WEIGHTS,
    commentScoring: DEFAULT_COMMENT_SCORING_SETTINGS,
    threadInterestModel: DEFAULT_THREAD_INTEREST_MODEL_SETTINGS,
  },
};

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

export const truncationLevels = ['Very Short', 'Short', 'Medium', 'Long', 'Full', 'Unset'] as const;
export type TruncationLevel = typeof truncationLevels[number];

export const levelToCommentLinesMap: Record<TruncationLevel, number> = {
  'Very Short': 0,
  'Short': 0,
  'Medium': 0,
  'Long': 0,
  'Full': 0,
  'Unset': 0,
};

export const levelToCommentBreakpointMap: Record<TruncationLevel, number | undefined> = {
  'Very Short': 50,
  'Short': 100,
  'Medium': 200,
  'Long': 1000,
  'Full': SHOW_ALL_BREAKPOINT_VALUE,
  'Unset': undefined  // not present
};

export const levelToPostBreakpointMap: Record<TruncationLevel, number | undefined> = {
  'Very Short': 50,
  'Short': 100,
  'Medium': 200,
  'Long': 2000,
  'Full': SHOW_ALL_BREAKPOINT_VALUE,
  'Unset': undefined  // not present
};

const getBreakpointLevelInternal = (
  breakpoint: number | undefined,
  levelMap: Record<TruncationLevel, number | undefined> 
): TruncationLevel => {
  if (breakpoint === undefined || breakpoint <= 0) return 'Unset';
  if (breakpoint === SHOW_ALL_BREAKPOINT_VALUE) return 'Full';

  let closestLevel: TruncationLevel = 'Very Short';
  let minDiff = Infinity;

  for (const level of truncationLevels) {
    if (level === 'Full' || level === 'Unset') continue;
    const mapVal = levelMap[level]; 
    if (mapVal === undefined || mapVal === null) continue;
    const diff = Math.abs(mapVal - breakpoint);
    if (diff < minDiff) {
      minDiff = diff;
      closestLevel = level;
    } else if (diff === minDiff && levelMap[level]! > levelMap[closestLevel]!) { 
      closestLevel = level;
    }
  }
  return closestLevel;
};

export const getCommentBreakpointLevel = (breakpoint: number | undefined): TruncationLevel => {
  return getBreakpointLevelInternal(breakpoint, levelToCommentBreakpointMap);
};

export const getFirstCommentLevel = (lines: number, breakpoint: number): TruncationLevel => {
  // uncomment if we reintroduce line clamp as default
  // if (lines === 2) {
  //   return 'Very Short';
  // }
  return getCommentBreakpointLevel(breakpoint);
};

export const getPostBreakpointLevel = (breakpoint: number | undefined): TruncationLevel => {
  return getBreakpointLevelInternal(breakpoint, levelToPostBreakpointMap);
};

export interface SettingsFormState {
  incognitoMode: boolean;
  sourceWeights: SourceWeightFormState;
  displaySetting: DisplaySettingsFormState;
  commentScoring: CommentScoringFormState;
  threadInterestModel: ThreadInterestModelFormState;
}

export interface SettingsFormErrors {
  sourceWeights?: Record<FeedItemSourceType, boolean>;
  lineClampNumberOfLines?: boolean;
  postBreakpoints?: boolean;
  commentBreakpoints?: boolean;
  commentScoring?: ZodFormattedError<CommentScoringFormState, string> | null;
  threadInterestModel?: ZodFormattedError<ThreadInterestModelFormState, string> | null;
}

export type WithEmptyString<T> = T extends number | string ? T | '' : T;

// Utility type to create a form state version of a settings object (allow values to be empty strings)
export type ToFormState<T> = {
  [P in keyof T]: T[P] extends (infer E)[]
    ? (WithEmptyString<E>)[]
    : WithEmptyString<T[P]>;
};

export type SourceWeightFormState = {
  [key in FeedItemSourceType]: number | '';
};
export type DisplaySettingsFormState = ToFormState<typeof DEFAULT_SETTINGS["displaySettings"]>;
export type CommentScoringFormState = ToFormState<typeof DEFAULT_SETTINGS["resolverSettings"]["commentScoring"]>;
export type ThreadInterestModelFormState = ToFormState<typeof DEFAULT_SETTINGS["resolverSettings"]["threadInterestModel"]>;

export const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings';
