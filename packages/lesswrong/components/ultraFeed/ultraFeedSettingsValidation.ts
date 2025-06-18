import { z } from 'zod';
import { DEFAULT_SETTINGS } from './ultraFeedSettingsTypes';
import { FeedItemSourceType, allFeedItemSourceTypes } from './ultraFeedTypes';

const sourceWeightsShape = allFeedItemSourceTypes.reduce((acc, key) => {
  acc[key] = z.number().min(0, { message: "Weight must be non-negative" });
  return acc;
}, {} as { [K in FeedItemSourceType]: z.ZodNumber });

const sourceWeightsSchema = z.object(sourceWeightsShape);

const displaySettingsValidation = z.object({
  lineClampNumberOfLines: z.number().int()
    .min(0, "Line clamp must be 0 or greater")
    .default(DEFAULT_SETTINGS.displaySettings.lineClampNumberOfLines),
  postInitialWords: z.number().int()
    .min(0, "Initial words must be 0 or greater")
    .default(DEFAULT_SETTINGS.displaySettings.postInitialWords),
  postMaxWords: z.number().int()
    .min(0, "Max words must be 0 or greater")
    .default(DEFAULT_SETTINGS.displaySettings.postMaxWords),
  commentCollapsedInitialWords: z.number().int()
    .min(0, "Collapsed words must be 0 or greater")
    .default(DEFAULT_SETTINGS.displaySettings.commentCollapsedInitialWords),
  commentExpandedInitialWords: z.number().int()
    .min(0, "Expanded words must be 0 or greater")
    .default(DEFAULT_SETTINGS.displaySettings.commentExpandedInitialWords),
  commentMaxWords: z.number().int()
    .min(0, "Max words must be 0 or greater")
    .default(DEFAULT_SETTINGS.displaySettings.commentMaxWords),
}).refine(data => data.postInitialWords <= data.postMaxWords, {
  message: "Initial words must be less than or equal to max words",
  path: ["postInitialWords"],
}).refine(data => data.commentCollapsedInitialWords <= data.commentExpandedInitialWords, {
  message: "Collapsed words must be less than or equal to expanded words",
  path: ["commentCollapsedInitialWords"],
}).refine(data => data.commentExpandedInitialWords <= data.commentMaxWords, {
  message: "Expanded words must be less than or equal to max words",
  path: ["commentExpandedInitialWords"],
});

const commentScoringSchema = z.object({
  commentDecayFactor: z.number().positive({ message: "Must be a positive number" }),
  commentDecayBiasHours: z.number().min(0, { message: "Must be non-negative" }),
  ultraFeedSeenPenalty: z.number()
    .min(0, { message: "Value must be between 0 and 1" })
    .max(1, { message: "Value must be between 0 and 1" }),
  quickTakeBoost: z.number()
    .min(0.5, { message: "Value must be between 0.5 and 3.0" })
    .max(3.0, { message: "Value must be between 0.5 and 3.0" }),
  commentSubscribedAuthorMultiplier: z.number()
    .min(1, { message: "Value must be between 1 and 10" })
    .max(10, { message: "Value must be between 1 and 10" }),
  threadScoreAggregation: z.enum(['sum', 'max', 'logSum', 'avg']),
  threadScoreFirstN: z.number().int().positive({ message: "Must be a positive integer" }),
});

const threadInterestModelSchema = z.object({
  commentCoeff: z.number().min(0, { message: "Must be non-negative" }),
  voteCoeff: z.number().min(0, { message: "Must be non-negative" }),
  viewCoeff: z.number().min(0, { message: "Must be non-negative" }),
  onReadPostFactor: z.number().min(0, { message: "Must be non-negative" }),
  logImpactFactor: z.number(),
  minOverallMultiplier: z.number().min(0, { message: "Must be non-negative" }),
  maxOverallMultiplier: z.number().min(0, { message: "Must be non-negative" }),
}).refine(data => data.minOverallMultiplier <= data.maxOverallMultiplier, {
  message: "Min overall multiplier must be less than or equal to max overall multiplier",
  path: ["minOverallMultiplier"], 
});

const resolverSettingsSchema = z.object({
  incognitoMode: z.boolean(),
  sourceWeights: sourceWeightsSchema.default(DEFAULT_SETTINGS.resolverSettings.sourceWeights),
  commentScoring: commentScoringSchema.default(DEFAULT_SETTINGS.resolverSettings.commentScoring),
  threadInterestModel: threadInterestModelSchema.default(DEFAULT_SETTINGS.resolverSettings.threadInterestModel),
});

export const ultraFeedSettingsSchema = z.object({
  displaySettings: displaySettingsValidation.default(DEFAULT_SETTINGS.displaySettings),
  resolverSettings: resolverSettingsSchema,
}).partial()

export type ValidatedUltraFeedSettings = z.infer<typeof ultraFeedSettingsSchema>;
export type ValidatedCommentScoring = z.infer<typeof commentScoringSchema>;
export type ValidatedThreadInterestModel = z.infer<typeof threadInterestModelSchema>;
export type UltraFeedSettingsZodErrors = z.ZodFormattedError<ValidatedUltraFeedSettings, string> | null; 
