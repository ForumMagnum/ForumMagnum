/**
 * @file ultraFeedSettingsTypes.ts
 * This file defines the UltraFeed settings types and default values.
 */
import { FeedItemSourceType } from './ultraFeedTypes';
import { ZodFormattedError } from 'zod';


export interface UltraFeedDisplaySettings {
  postInitialWords: number;
  postMaxWords: number;
  lineClampNumberOfLines: number;
  commentCollapsedInitialWords: number;
  commentExpandedInitialWords: number;
  commentMaxWords: number;
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
  postInitialWords: 100,
  postMaxWords: 250,
  lineClampNumberOfLines: 0,
  commentCollapsedInitialWords: 50,
  commentExpandedInitialWords: 100,
  commentMaxWords: 250,
};

export const truncationLevels = ['Very Short', 'Short', 'Medium', 'Long', 'Full'] as const;
export type TruncationLevel = typeof truncationLevels[number];
export const SHOW_ALL_BREAKPOINT_VALUE = 100_000;

export const levelToWordCountMap: Record<TruncationLevel, number> = {
  'Very Short': 50,
  'Short': 100,
  'Medium': 250,
  'Long': 1000,
  'Full': SHOW_ALL_BREAKPOINT_VALUE,
};

export const levelToPostWordCountMap: Record<TruncationLevel, number> = {
  'Very Short': 50,
  'Short': 100,
  'Medium': 250,
  'Long': 2000,
  'Full': SHOW_ALL_BREAKPOINT_VALUE,
};


export const DEFAULT_SOURCE_WEIGHTS: Record<FeedItemSourceType, number> = {
  'recentComments': 30,
  'quicktakes': 20,
  'subscriptionsComments': 15,
  'recombee-lesswrong-custom': 30,
  'hacker-news': 30,
  'subscriptionsPosts': 15,
  'spotlights': 2,
  'bookmarks': 1,
};
export interface CommentScoringSettings {
  commentDecayFactor: number;
  commentDecayBiasHours: number;
  quickTakeBoost: number;
  commentSubscribedAuthorMultiplier: number;
  threadScoreAggregation: 'sum' | 'max' | 'logSum' | 'avg';
  threadScoreFirstN: number;
}

const DEFAULT_COMMENT_SCORING_SETTINGS: CommentScoringSettings = {
  commentDecayFactor: 1.8,
  commentDecayBiasHours: 2,
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
  repetitionDecayHours: number;
  repetitionPenaltyStrength: number;
}

const DEFAULT_THREAD_INTEREST_MODEL_SETTINGS: ThreadInterestModelSettings = {
  commentCoeff: 5,
  voteCoeff: 2,
  viewCoeff: 1,
  onReadPostFactor: 1.1,
  logImpactFactor: 0.5,
  minOverallMultiplier: 0.5,
  maxOverallMultiplier: 20.0,
  repetitionDecayHours: 1.0,
  repetitionPenaltyStrength: 0.5,
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
    key: 'subscriptionsPosts',
    label: "Posts from Followed Users",
    description: "Recent posts from users you've subscribed to or followed."
  },
  {
    key: 'subscriptionsComments',
    label: "Comments from Followed Users",
    description: "Recent comments from users you've subscribed to or followed."
  },
  {
    key: 'quicktakes',
    label: "Quick Takes",
    description: "Lighweight mini-posts"
  },
  {
    key: 'recentComments',
    label: "Recent Comments",
    description: "Recent comments, prioritized karma and previous engagement with the threads or posts they're on"
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
    description: "We can throw in of your bookmarks to remind you about them."
  },
];

export const getWordCountLevel = (
  wordCount: number | undefined,
  levelMap: Record<TruncationLevel, number> = levelToWordCountMap
): TruncationLevel => {
  if (wordCount === undefined || wordCount <= 0) return 'Very Short';
  if (wordCount >= SHOW_ALL_BREAKPOINT_VALUE) return 'Full';

  let closestLevel: TruncationLevel = 'Very Short';
  let minDiff = Infinity;

  for (const level of truncationLevels) {
    const mapVal = levelMap[level]; 
    const diff = Math.abs(mapVal - wordCount);
    if (diff < minDiff) {
      minDiff = diff;
      closestLevel = level;
    } else if (diff === minDiff && levelMap[level] > levelMap[closestLevel]) { 
      closestLevel = level;
    }
  }
  return closestLevel;
};

export const getCommentWordCountLevel = (wordCount: number | undefined): TruncationLevel => {
  return getWordCountLevel(wordCount, levelToWordCountMap);
};

export const getPostWordCountLevel = (wordCount: number | undefined): TruncationLevel => {
  return getWordCountLevel(wordCount, levelToPostWordCountMap);
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
  postInitialWords?: boolean;
  postMaxWords?: boolean;
  commentCollapsedInitialWords?: boolean;
  commentExpandedInitialWords?: boolean;
  commentMaxWords?: boolean;
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
