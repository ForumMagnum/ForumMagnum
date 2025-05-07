import { z } from 'zod';
import { DEFAULT_SETTINGS } from './ultraFeedSettingsTypes';

const ascendingNumbersOrNull = z.array(z.number().positive().nullable()).refine(arr => {
  let lastNumber: number | undefined;
  let nullSeen = false;

  for (const item of arr) {
    if (item === null) {
      nullSeen = true;
      continue;
    }
    if (nullSeen) return false;
    if (lastNumber !== undefined && item <= lastNumber) return false;
    lastNumber = item;
  }
  return true;
}, {
  message: "Breakpoints must be ascending positive numbers; the last N values may be unset (null)"
});

// Schema for the settings object shape that we intend to save
export const ultraFeedSettingsSchema = z.object({
  sourceWeights: z.record(
    z.string(),
    z.number().min(0, { message: "Weight must be non-negative" })
  ).default(DEFAULT_SETTINGS.sourceWeights),
  commentDecayFactor: z.number().positive().default(DEFAULT_SETTINGS.commentDecayFactor),
  commentDecayBiasHours: z.number().default(DEFAULT_SETTINGS.commentDecayBiasHours),
  ultraFeedSeenPenalty: z.number()
    .min(0, { message: "Value must be between 0 and 1" })
    .max(1, { message: "Value must be between 0 and 1" })
    .default(DEFAULT_SETTINGS.ultraFeedSeenPenalty),
  quickTakeBoost: z.number()
    .min(0.5, { message: "Value must be between 0.5 and 3.0" })
    .max(3.0, { message: "Value must be between 0.5 and 3.0" })
    .default(DEFAULT_SETTINGS.quickTakeBoost),
  commentSubscribedAuthorMultiplier: z.number()
    .min(1, { message: "Value must be between 1 and 10" })
    .max(10, { message: "Value must be between 1 and 10" })
    .default(DEFAULT_SETTINGS.commentSubscribedAuthorMultiplier),
  threadScoreAggregation: z.enum(['sum', 'max', 'logSum', 'avg'])
    .default(DEFAULT_SETTINGS.threadScoreAggregation),
  threadScoreFirstN: z.number().int().positive()
    .default(DEFAULT_SETTINGS.threadScoreFirstN),
  incognitoMode: z.boolean().default(DEFAULT_SETTINGS.incognitoMode),
  postTruncationBreakpoints: ascendingNumbersOrNull
    .default(DEFAULT_SETTINGS.postTruncationBreakpoints),
  lineClampNumberOfLines: z.number().int()
    .min(0, { message: "Value must be between 0 and 10" })
    .max(10, { message: "Value must be between 0 and 10" })
    .default(DEFAULT_SETTINGS.lineClampNumberOfLines),
  commentTruncationBreakpoints: ascendingNumbersOrNull
    .default(DEFAULT_SETTINGS.commentTruncationBreakpoints),
  postTitlesAreModals: z.boolean().default(DEFAULT_SETTINGS.postTitlesAreModals),
  threadVotePowerWeight: z.number().min(0).max(1).default(DEFAULT_SETTINGS.threadVotePowerWeight),
  threadParticipationWeight: z.number().min(0).max(1).default(DEFAULT_SETTINGS.threadParticipationWeight),
  threadViewScoreWeight: z.number().min(0).max(1).default(DEFAULT_SETTINGS.threadViewScoreWeight),
  threadOnReadPostWeight: z.number().min(0).max(1).default(DEFAULT_SETTINGS.threadOnReadPostWeight),
}).partial();

export type ValidatedUltraFeedSettings = z.infer<typeof ultraFeedSettingsSchema>;
export type UltraFeedSettingsZodErrors = z.ZodFormattedError<ValidatedUltraFeedSettings, string> | null; 
