/**
 * @file ultraFeedSettingsTypes.ts
 * This file defines the UltraFeed settings types and default values.
 */
import { FeedItemSourceType } from './ultraFeedTypes';
import { ZodFormattedError } from 'zod';


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

interface DefaultUltraFeedResolverSettings {
  incognitoMode: boolean;
  sourceWeights: Record<FeedItemSourceType, number>;
  threadInterestModel: ThreadInterestModelSettings;
  commentScoring: CommentScoringSettings;
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

interface DefaultUltraFeedSettings {
  displaySettings: DefaultUltraFeedDisplaySettings;
  resolverSettings: DefaultUltraFeedResolverSettings;
}

const DEFAULT_DISPLAY_SETTINGS: UltraFeedDisplaySettings = {
  postTruncationBreakpoints: [200, 2000],
  lineClampNumberOfLines: 2,
  commentTruncationBreakpoints: [50, 200, 1000],
  postTitlesAreModals: true,
};

export const DEFAULT_SOURCE_WEIGHTS: Record<FeedItemSourceType, number> = {
  'recombee-lesswrong-custom': 30,
  'hacker-news': 30,
  'recentComments': 60,
  'spotlights': 10,
  'bookmarks': 10,
  'subscriptions': 10,
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
  ultraFeedSeenPenalty: 0.1,
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

// Now define the constant using this explicit type
export const DEFAULT_SETTINGS: DefaultUltraFeedSettings = {
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

export type SourceWeightFormState = {
  [key in FeedItemSourceType]: number | '';
}

export interface DisplaySettingsFormState {
  lineClampNumberOfLines: number | '';
  postBreakpoints: (number | null | '')[];
  commentBreakpoints: (number | null | '')[];
  postTitlesAreModals: boolean;
}

export interface CommentScoringFormState {
  ultraFeedSeenPenalty: number | '';
  quickTakeBoost: number | '';
  commentSubscribedAuthorMultiplier: number | '';
  commentDecayFactor: number | '';
  commentDecayBiasHours: number | '';
  threadScoreAggregation: 'sum' | 'max' | 'logSum' | 'avg' | '';
  threadScoreFirstN: number | '';
}
export interface ThreadInterestModelFormState {
  commentCoeff: number | '';
  voteCoeff: number | '';
  viewCoeff: number | '';
  onReadPostFactor: number | '';
  logImpactFactor: number | '';
  minOverallMultiplier: number | '';
  maxOverallMultiplier: number | '';
}

export const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings';
