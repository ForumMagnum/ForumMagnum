import { calculateActivityFactor } from './collections/useractivities/utils';
import { isLW, activityHalfLifeSetting, activityWeightSetting, curatedBonusSetting, decayFactorFastestSetting, decayFactorSlowestSetting, frontpageBonusSetting, startingAgeHoursSetting, timeDecayFactorSetting } from './instanceSettings';

export const TIME_DECAY_FACTOR = timeDecayFactorSetting;
// Basescore bonuses for various categories
export const FRONTPAGE_BONUS = frontpageBonusSetting;
export const CURATED_BONUS = curatedBonusSetting;
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

    const frontpageBonus = (item as any).frontpageDate ? FRONTPAGE_BONUS.get() : 0;
    const curatedBonus = (item as any).curatedDate ? CURATED_BONUS.get() : 0;
    baseScore = baseScore + frontpageBonus + curatedBonus;

    // HN algorithm
    const newScore = Math.round((baseScore / Math.pow(ageInHours + SCORE_BIAS, TIME_DECAY_FACTOR.get()))*1000000)/1000000;

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

export const frontpageTimeDecayExpr = (props: TimeDecayExprProps, context: ResolverContext) => {
  const {
    startingAgeHours,
    decayFactorSlowest,
    decayFactorFastest,
    activityWeight,
    activityHalfLifeHours,
    overrideActivityFactor,
  } = {
    startingAgeHours: props?.startingAgeHours ?? startingAgeHoursSetting.get(),
    decayFactorSlowest: props?.decayFactorSlowest ?? decayFactorSlowestSetting.get(),
    decayFactorFastest: props?.decayFactorFastest ?? decayFactorFastestSetting.get(),
    activityWeight: props?.activityWeight ?? activityWeightSetting.get(),
    activityHalfLifeHours: props?.activityHalfLifeHours ?? activityHalfLifeSetting.get(),
    overrideActivityFactor: props?.overrideActivityFactor,
  };

  // See lib/collections/useractivities/collection.ts for a high-level overview
  const activityFactor = overrideActivityFactor ??
    calculateActivityFactor(context?.visitorActivity?.activityArray, activityHalfLifeHours)

  // Higher timeDecayFactor => more recency bias
  const timeDecayFactor = Math.min(
    decayFactorSlowest * (1 + (activityWeight * activityFactor)),
    decayFactorFastest
  );

  const ageInHours = {
    $divide: [
      {
        $subtract: [
          new Date(),
          "$postedAt", // Age in miliseconds
        ],
      },
      60 * 60 * 1000,
    ],
  };

  return { $pow: [{ $add: [ageInHours, startingAgeHours] }, timeDecayFactor] };
}

// SCORE_BIAS is used in updateScores.ts which is used for all votable documents, this here is used for frontpage posts only. SCORE_BIAS is weirdly name. 
// It is just adding to the age of the post to make the score decay faster, preventing low karma posts getting on the frontpage for very long.
const getAgeOffset = () => isLW() ? 6 : SCORE_BIAS 

export const timeDecayExpr = () => {
  return {$pow: [
    {$add: [
      {$divide: [
        {$subtract: [
          new Date(), '$postedAt' // Age in miliseconds
        ]},
        60 * 60 * 1000
      ] }, // Age in hours
      getAgeOffset()
    ]},
    TIME_DECAY_FACTOR.get()
  ]}
}

export const postScoreModifiers = () => {
  return [
    {$cond: {if: "$frontpageDate", then: FRONTPAGE_BONUS.get(), else: 0}},
    {$cond: {if: "$curatedDate", then: CURATED_BONUS.get(), else: 0}}
  ];
};

