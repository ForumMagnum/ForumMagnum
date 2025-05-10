import { z } from 'zod';
import { DEFAULT_SETTINGS } from './ultraFeedSettingsTypes';
import type { FeedItemSourceType } from './ultraFeedTypes';
import type { UltraFeedSettingsType } from './ultraFeedSettingsTypes';

const sourceWeightsSchema = z.record(
  z.custom<FeedItemSourceType>(), 
  z.number().min(0, { message: "Weight must be non-negative" })
);

// Custom Zod schema to validate an array of numbers that are positive and strictly ascending,
// allowing for nulls only at the end.
const ascendingNumbersOrNullDefinition = (arr: (number | null)[]) => {
  let lastNumber: number | undefined;
  let nullSeen = false;

  for (const item of arr) {
    if (item === null) {
      nullSeen = true;
      continue;
    }
    // If we've seen a null, no more numbers are allowed.
    if (nullSeen) return false;
    // If item is a number, it must be greater than the last number.
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
  postTruncationBreakpoints: z.array(z.union([z.number().int().min(0), z.null()]))
    .max(3, { message: "At most 3 post breakpoints allowed" })
    .refine(ascendingNumbersOrNullDefinition, {
      message: "Post breakpoints must be positive, strictly ascending numbers. Unset values (null) can only appear at the end."
    })
    .default(DEFAULT_SETTINGS.displaySettings.postTruncationBreakpoints),
  commentTruncationBreakpoints: z.array(z.union([z.number().int().min(0), z.null()]))
    .max(3, { message: "At most 3 comment breakpoints allowed" })
    .refine(ascendingNumbersOrNullDefinition, {
      message: "Comment breakpoints must be positive, strictly ascending numbers. Unset values (null) can only appear at the end."
    })
    .default(DEFAULT_SETTINGS.displaySettings.commentTruncationBreakpoints),
  postTitlesAreModals: z.boolean().default(DEFAULT_SETTINGS.displaySettings.postTitlesAreModals),
});

const commentScoringSchema = z.object({
  commentDecayFactor: z.number().positive({ message: "Must be a positive number" }),
  commentDecayBiasHours: z.number(),
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
  commentCoeff: z.number(),
  voteCoeff: z.number(),
  viewCoeff: z.number(),
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

// Export the schema, marked as partial to allow for partial updates
export const ultraFeedSettingsSchema = z.object({
  displaySettings: displaySettingsSchema.default(DEFAULT_SETTINGS.displaySettings),
  resolverSettings: resolverSettingsSchema,
}).partial() as z.ZodType<UltraFeedSettingsType>; 

export type ValidatedUltraFeedSettings = z.infer<typeof ultraFeedSettingsSchema>;
export type UltraFeedSettingsZodErrors = z.ZodFormattedError<ValidatedUltraFeedSettings, string> | null; 
