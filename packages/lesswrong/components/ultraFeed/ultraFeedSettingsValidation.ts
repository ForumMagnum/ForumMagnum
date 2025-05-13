import { z } from 'zod';
import { DEFAULT_SETTINGS } from './ultraFeedSettingsTypes';
import type { FeedItemSourceType } from './ultraFeedTypes';
import type { UltraFeedSettingsType } from './ultraFeedSettingsTypes';

const sourceWeightsSchema = z.record(
  z.custom<FeedItemSourceType>(), 
  z.number().min(0, { message: "Weight must be non-negative" })
);

const strictlyAscendingNumbersDefinition = (arr: number[]) => {
  let lastNumber: number | undefined;

  for (const item of arr) {
    if (lastNumber !== undefined && item <= lastNumber) return false;
    lastNumber = item;
  }
  return true;
};

const displaySettingsSchema = z.object({
  lineClampNumberOfLines: z.number().int()
    .min(0, { message: "Value must be between 0 and 10" })
    .max(10, { message: "Value must be between 0 and 10" })
    .default(DEFAULT_SETTINGS.displaySettings.lineClampNumberOfLines),
  postTruncationBreakpoints: z.array(z.number().int().min(0))
    .max(3, { message: "At most 3 post breakpoints allowed" })
    .refine(strictlyAscendingNumbersDefinition, {
      message: "Post breakpoints must be non-negative, strictly ascending numbers."
    })
    .default(DEFAULT_SETTINGS.displaySettings.postTruncationBreakpoints),
  commentTruncationBreakpoints: z.array(z.number().int().min(0))
    .max(3, { message: "At most 3 comment breakpoints allowed" })
    .refine(strictlyAscendingNumbersDefinition, {
      message: "Comment breakpoints must be non-negative, strictly ascending numbers."
    })
    .default(DEFAULT_SETTINGS.displaySettings.commentTruncationBreakpoints),
  postTitlesAreModals: z.boolean().default(DEFAULT_SETTINGS.displaySettings.postTitlesAreModals),
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
  displaySettings: displaySettingsSchema.default(DEFAULT_SETTINGS.displaySettings),
  resolverSettings: resolverSettingsSchema,
}).partial() as z.ZodType<UltraFeedSettingsType>; 

export type ValidatedUltraFeedSettings = z.infer<typeof ultraFeedSettingsSchema>;
export type UltraFeedSettingsZodErrors = z.ZodFormattedError<ValidatedUltraFeedSettings, string> | null; 
