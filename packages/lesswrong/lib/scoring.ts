import { calculateActivityFactor } from './collections/useractivities/utils';
import { type ForumTypeString, defaultActivityHalfLife, defaultActivityWeight, curatedScoreBonus, defaultDecayFactorFastest, defaultDecayFactorSlowest, frontpageScoreBonus, defaultStartingAgeHours, timeDecayFactor } from './instanceSettings';

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

type TimeDecayExprProps = {
  startingAgeHours?: number
  decayFactorSlowest?: number
  decayFactorFastest?: number
  activityWeight?: number
  activityHalfLifeHours?: number
  overrideActivityFactor?: number
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

export const getFrontpageTimeDecayParams = (props: TimeDecayExprProps, visitorActivity: DbUserActivity|null): TimeDecayParams => {
  const {
    startingAgeHours,
    decayFactorSlowest,
    decayFactorFastest,
    activityWeight,
    activityHalfLifeHours,
    overrideActivityFactor,
  } = {
    startingAgeHours: props?.startingAgeHours ?? defaultStartingAgeHours,
    decayFactorSlowest: props?.decayFactorSlowest ?? defaultDecayFactorSlowest,
    decayFactorFastest: props?.decayFactorFastest ?? defaultDecayFactorFastest,
    activityWeight: props?.activityWeight ?? defaultActivityWeight,
    activityHalfLifeHours: props?.activityHalfLifeHours ?? defaultActivityHalfLife,
    overrideActivityFactor: props?.overrideActivityFactor,
  };

  // See lib/collections/useractivities/collection.ts for a high-level overview
  const activityFactor = overrideActivityFactor ??
    calculateActivityFactor(visitorActivity?.activityArray, activityHalfLifeHours)

  // Higher timeDecayFactor => more recency bias
  const timeDecayFactor = Math.min(
    decayFactorSlowest * (1 + (activityWeight * activityFactor)),
    decayFactorFastest
  );

  return { ageOffsetHours: startingAgeHours, exponent: timeDecayFactor, activityFactor };
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

export const postScoreModifiers = (): ScoreTerm[] => [
  { label: "Frontpage bonus", expr: {$cond: {if: "$frontpageDate", then: FRONTPAGE_BONUS, else: 0}} },
  { label: "Curated bonus", expr: {$cond: {if: "$curatedDate", then: CURATED_BONUS, else: 0}} },
];

