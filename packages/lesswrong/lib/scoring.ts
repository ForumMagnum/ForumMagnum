import mapValues from 'lodash/mapValues';
import { calculateActivityFactor } from './collections/useractivities/utils';
import { type ForumTypeString, defaultActivityHalfLife, defaultActivityWeight, curatedScoreBonus, defaultDecayFactorFastest, defaultDecayFactorSlowest, frontpageScoreBonus, defaultStartingAgeHours, timeDecayFactor } from './instanceSettings';
import { objectKeys } from './utils/typeGuardUtils';

export const TIME_DECAY_FACTOR = timeDecayFactor;
// Basescore bonuses for various categories
export const FRONTPAGE_BONUS = frontpageScoreBonus;
export const CURATED_BONUS = curatedScoreBonus;
export const SCORE_BIAS = 2;

// NB: If you want to change this algorithm, make sure to also change the
// modifier functions below, and the SQL in updateScores.ts (until the refactor
// that is definitely immenent and will not get put off I'm sure ;)
export const recalculateScore = (item: VoteableType) => {
  // Age Check
  if ((item as any).postedAt) {
    const postedAt = (item as any).postedAt.valueOf();
    const now = new Date().getTime();
    const age = now - postedAt;
    const ageInHours = age / (60 * 60 * 1000);

    // use baseScore if defined, if not just use 0
    let baseScore = item.baseScore || 0;

    const frontpageBonus = (item as any).frontpageDate ? FRONTPAGE_BONUS : 0;
    const curatedBonus = (item as any).curatedDate ? CURATED_BONUS : 0;
    baseScore = baseScore + frontpageBonus + curatedBonus;

    // HN algorithm
    const newScore = Math.round((baseScore / Math.pow(ageInHours + SCORE_BIAS, TIME_DECAY_FACTOR))*1000000)/1000000;

    return newScore;
  } else {
    return item.baseScore ?? 0;
  }
};

export interface FrontpageScoringParams {
  karmaExponent: number
  commentWeight: number
  frontpageBonus: number
  curatedBonus: number
  startingAgeHours: number
  decayFactorSlowest: number
  decayFactorFastest: number
  activityWeight: number
  activityHalfLifeHours: number
}

export interface FrontpageScoringOverrides extends Partial<FrontpageScoringParams> {
  /** Used instead of the activity factor calculated from the visitor's visit history */
  activityFactor?: number
}

interface ResolvedFrontpageScoring extends FrontpageScoringParams {
  activityFactorOverride: number|undefined
}

interface NumericRange {
  min: number
  max: number
}

interface ScoringParamSpec extends NumericRange {
  defaultValue: number
}

// The ranges are what keeps the score defined when it's evaluated in SQL: the
// time decay's base stays positive (Postgres raises an error for a negative
// base with a fractional exponent, and for dividing by zero), zero karma is
// never raised to a negative power, and nothing overflows a double.
export const frontpageScoringParamSpecs: Record<keyof FrontpageScoringParams, ScoringParamSpec> = {
  karmaExponent: { defaultValue: 1, min: 0, max: 10 },
  commentWeight: { defaultValue: 0, min: -1000, max: 1000 },
  frontpageBonus: { defaultValue: frontpageScoreBonus, min: -10000, max: 10000 },
  curatedBonus: { defaultValue: curatedScoreBonus, min: -10000, max: 10000 },
  startingAgeHours: { defaultValue: defaultStartingAgeHours, min: 0.01, max: 10000 },
  decayFactorSlowest: { defaultValue: defaultDecayFactorSlowest, min: 0, max: 10 },
  decayFactorFastest: { defaultValue: defaultDecayFactorFastest, min: 0, max: 10 },
  activityWeight: { defaultValue: defaultActivityWeight, min: 0, max: 100 },
  activityHalfLifeHours: { defaultValue: defaultActivityHalfLife, min: 1, max: 10000 },
};

const scoringOverrideRanges: Record<keyof FrontpageScoringOverrides, NumericRange> = {
  ...frontpageScoringParamSpecs,
  activityFactor: { min: 0, max: 1 },
};

const defaultFrontpageScoringParams: FrontpageScoringParams = mapValues(frontpageScoringParamSpecs, spec => spec.defaultValue);

export const isValidFrontpageScoringOverride = (name: keyof FrontpageScoringOverrides, value: unknown): value is number => {
  const { min, max } = scoringOverrideRanges[name];
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
};

/**
 * Overrides arrive as unvalidated JSON from the client and end up inside query
 * expressions, where a string like "$fieldName" would be read as a reference
 * to that field. So this rejects everything except known parameters with
 * in-range numeric values, whatever the declared type says.
 */
export function resolveFrontpageScoring(overrides: FrontpageScoringOverrides): ResolvedFrontpageScoring {
  for (const name of objectKeys(overrides)) {
    if (!Object.hasOwn(scoringOverrideRanges, name) || !isValidFrontpageScoringOverride(name, overrides[name])) {
      throw new Error(`Invalid frontpage scoring override: ${name}=${JSON.stringify(overrides[name])}`);
    }
  }
  const { activityFactor, ...paramOverrides } = overrides;
  return { ...defaultFrontpageScoringParams, ...paramOverrides, activityFactorOverride: activityFactor };
}

export interface TimeDecayParams {
  ageOffsetHours: number
  exponent: number
  activityFactor: number|null
}

export interface ScoreTerm {
  label: string
  expr: AnyBecauseHard
}

export const getFrontpageTimeDecayParams = (scoring: ResolvedFrontpageScoring, visitorActivity: DbUserActivity|null): TimeDecayParams => {
  // See lib/collections/useractivities/collection.ts for a high-level overview
  const activityFactor = scoring.activityFactorOverride ??
    calculateActivityFactor(visitorActivity?.activityArray, scoring.activityHalfLifeHours)

  // Higher timeDecayFactor => more recency bias
  const timeDecayFactor = Math.min(
    scoring.decayFactorSlowest * (1 + (scoring.activityWeight * activityFactor)),
    scoring.decayFactorFastest
  );

  return { ageOffsetHours: scoring.startingAgeHours, exponent: timeDecayFactor, activityFactor };
}

// SCORE_BIAS is used in updateScores.ts which is used for all votable documents, this here is used for frontpage posts only. SCORE_BIAS is weirdly name. 
// It is just adding to the age of the post to make the score decay faster, preventing low karma posts getting on the frontpage for very long.
const getAgeOffset = (forumType: ForumTypeString) => forumType === 'LessWrong' ? 6 : SCORE_BIAS

export const getStandardTimeDecayParams = (forumType: ForumTypeString): TimeDecayParams => ({
  ageOffsetHours: getAgeOffset(forumType),
  exponent: TIME_DECAY_FACTOR,
  activityFactor: null,
});

export const postAgeInHoursExpr = () => ({
  $divide: [
    { $subtract: [new Date(), "$postedAt"] },
    60 * 60 * 1000,
  ],
});

export const timeDecayExpr = ({ ageOffsetHours, exponent }: TimeDecayParams) => ({
  $pow: [{ $add: [postAgeInHoursExpr(), ageOffsetHours] }, exponent],
});

// Postgres raises an error for a negative base with a fractional exponent, so
// the exponent is applied to the magnitude and the sign is put back afterwards.
const signedPowExpr = (field: string, exponent: number) => ({
  $multiply: [
    { $cond: { if: { $lt: [field, 0] }, then: -1, else: 1 } },
    { $pow: [{ $abs: field }, exponent] },
  ],
});

export const postKarmaTerms = ({ karmaExponent, commentWeight }: FrontpageScoringParams): ScoreTerm[] => [
  karmaExponent === 1
    ? { label: "Karma", expr: "$baseScore" }
    : { label: `Karma ^ ${karmaExponent}`, expr: signedPowExpr("$baseScore", karmaExponent) },
  ...(commentWeight !== 0
    ? [{ label: `Comments × ${commentWeight}`, expr: { $multiply: ["$commentCount", commentWeight] } }]
    : []),
];

export const postScoreModifiers = ({ frontpageBonus, curatedBonus }: FrontpageScoringParams): ScoreTerm[] => [
  { label: "Frontpage bonus", expr: {$cond: {if: "$frontpageDate", then: frontpageBonus, else: 0}} },
  { label: "Curated bonus", expr: {$cond: {if: "$curatedDate", then: curatedBonus, else: 0}} },
];

