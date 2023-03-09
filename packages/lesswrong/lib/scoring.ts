import sum from 'lodash/sum';
import { DatabasePublicSetting } from './publicSettings';

/**
 * We apply a score boost to subforum comments using the formula:
 *   max(b, m * (1 - ((x / d) ** p)))
 * where b is the base (the minimum boost received after the duration
 * has expired), m is the magnitude (the maximum boost when the comment
 * is first posted), d is the duration in hours, p is the exponent
 * (defining the dropoff curve), and x is the elapsed time since the
 * comment was posted in hours.
 */
const defaultSubforumCommentBonus = {
  base: 5,
  magnitude: 100,
  duration: 8,
  exponent: 0.3,
} as const;

type SubforumCommentBonus = typeof defaultSubforumCommentBonus;

const timeDecayFactorSetting = new DatabasePublicSetting<number>('timeDecayFactor', 1.15)
const frontpageBonusSetting = new DatabasePublicSetting<number>('frontpageScoreBonus', 10)
const curatedBonusSetting = new DatabasePublicSetting<number>('curatedScoreBonus', 10)
const subforumCommentBonusSetting = new DatabasePublicSetting<SubforumCommentBonus>(
  'subforumCommentBonus',
  defaultSubforumCommentBonus,
);

export const TIME_DECAY_FACTOR = timeDecayFactorSetting;
// Basescore bonuses for various categories
export const FRONTPAGE_BONUS = frontpageBonusSetting;
export const CURATED_BONUS = curatedBonusSetting;
export const SCORE_BIAS = 2;

export const getSubforumScoreBoost = (): SubforumCommentBonus => {
  const defaultBonus = {...defaultSubforumCommentBonus};
  const bonus = subforumCommentBonusSetting.get();
  return Object.assign(defaultBonus, bonus);
}

/**
 * This implements the same formula as commentScoreModifiers below
 */
const getSubforumCommentBonus = (item: VoteableType) => {
  if ("tagCommentType" in item && item["tagCommentType"] === "SUBFORUM") {
    const {base, magnitude, duration, exponent} = getSubforumScoreBoost();
    const createdAt = (item as any).createdAt ?? new Date();
    const ageHours = (Date.now() - createdAt.getTime()) / 3600000;
    return Math.max(base, magnitude * (1 - ((ageHours / duration) ** exponent)));
  }
  return 0;
}

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
    const subforumBonus = getSubforumCommentBonus(item);
    baseScore = baseScore + frontpageBonus + curatedBonus + subforumBonus;

    // HN algorithm
    const newScore = Math.round((baseScore / Math.pow(ageInHours + SCORE_BIAS, TIME_DECAY_FACTOR.get()))*1000000)/1000000;

    return newScore;
  } else {
    return item.baseScore;
  }
};

// type for timeDecayExpr props
type TimeDecayExprProps = {
  now?: string | Date | null,
  hypStartingAgeHours?: number
  hypDecayFactorSlowest?: number
  hypDecayFactorFastest?: number
  expHalfLifeHours?: number
  expWeight?: number
  activityHalfLifeHours?: number
  activityWeight?: number
  activity: Array<number>
}

export const defaultTimeDecayExprProps = {
  now: null,
  hypStartingAgeHours: SCORE_BIAS,
  hypDecayFactorSlowest: 0.5,
  hypDecayFactorFastest: 1.08,
  expHalfLifeHours: 48,
  expWeight: 0,
  activityHalfLifeHours: 72,
  activityWeight: 0.2,
  activity: Array(28).fill(0),
}

export const calculateDecayFactor = ({
  activity,
  activityHalfLifeHours,
  hypDecayFactorSlowest,
  hypDecayFactorFastest,
  activityWeight
}: {
  activity: Array<number>,
  activityHalfLifeHours: number,
  hypDecayFactorSlowest: number,
  hypDecayFactorFastest: number,
  activityWeight: number,
}
  ) => {
  const discountedActivity = activity.map((activity, i) => {
    const ageInHours = i * 24;
    const activityHalfLife = activityHalfLifeHours;
    const activityDecayFactor = Math.log(2) / activityHalfLife;
    return activity * Math.exp(-activityDecayFactor * ageInHours);
  });
  const maxActivity = Array(28).fill(1).map((activity, i) => {
    const ageInHours = i * 24;
    const activityHalfLife = activityHalfLifeHours;
    const activityDecayFactor = Math.log(2) / activityHalfLife;
    return activity * Math.exp(-activityDecayFactor * ageInHours);
  })

  // normalise such that being active every day results in a factor of 1
  const activityFactor = sum(discountedActivity) / sum(maxActivity);
  console.log("activityFactor", activityFactor)
  console.log("activityWeight", activityWeight)
  console.log("calculated hypDecayFactor", hypDecayFactorSlowest * (1 + (activityWeight * activityFactor)))
  const hypDecayFactor = Math.min(
    hypDecayFactorSlowest * (1 + (activityWeight * activityFactor)),
    hypDecayFactorFastest
  );
  return {hypDecayFactor, activityFactor};
}

export const timeDecayExpr = (props?: TimeDecayExprProps) => {
  const {
    now,
    hypStartingAgeHours,
    hypDecayFactorSlowest,
    hypDecayFactorFastest,
    expHalfLifeHours,
    expWeight,
    activityHalfLifeHours,
    activityWeight,
    activity,
  } = {
    now: props?.now || defaultTimeDecayExprProps.now,
    hypStartingAgeHours: props?.hypStartingAgeHours ?? defaultTimeDecayExprProps.hypStartingAgeHours,
    hypDecayFactorSlowest: props?.hypDecayFactorSlowest ?? defaultTimeDecayExprProps.hypDecayFactorSlowest,
    hypDecayFactorFastest: props?.hypDecayFactorFastest ?? defaultTimeDecayExprProps.hypDecayFactorFastest,
    expHalfLifeHours: props?.expHalfLifeHours ?? defaultTimeDecayExprProps.expHalfLifeHours,
    expWeight: props?.expWeight ?? defaultTimeDecayExprProps.expWeight,
    activityHalfLifeHours: props?.activityHalfLifeHours ?? defaultTimeDecayExprProps.activityHalfLifeHours,
    activityWeight: props?.activityWeight ?? defaultTimeDecayExprProps.activityWeight,
    activity: props?.activity ? Object.keys(props.activity).map(k => props.activity[k]) : defaultTimeDecayExprProps.activity,
  };

  // console.log("activity in timeDecayExpr", activity)

  // TODO this is where the activity factor is going to come in
  const { hypDecayFactor } = calculateDecayFactor({
    activity,
    activityHalfLifeHours,
    hypDecayFactorSlowest,
    hypDecayFactorFastest,
    activityWeight
  })
  console.log("slowest possible hypDecayFactor", hypDecayFactorSlowest)
  console.log("fastest possible hypDecayFactor", hypDecayFactorFastest)
  console.log("hypDecayFactor", hypDecayFactor)
  // Half life is directly related to decay factor exp(-lambda * t) <=> exp(-(ln(2)/halfLife) * t)
  const expDecayFactor = Math.log(2) / expHalfLifeHours;
  const hypWeight = 1 - expWeight;

  const ageInHours = {
    $divide: [
      {
        $subtract: [
          now ? new Date(now) : new Date(),
          "$postedAt", // Age in miliseconds
        ],
      },
      60 * 60 * 1000,
    ],
  };
  // Disallow negative ages by falling back to a very large number
  const ageInHoursNonNegative = {
    $cond: {
      if: { $gte: [ageInHours, 0] },
      then: ageInHours,
      else: 1e15,
    },
  };

  const exponentialTerm = { $exp:
    // $min to prevent overflow
    { $min: [
      { $multiply: [expDecayFactor, ageInHoursNonNegative] }, 20
    ] } };
  const hyperbolicTerm = { $pow: [{ $add: [ageInHoursNonNegative, hypStartingAgeHours] }, hypDecayFactor] };

  // The karma based part of the score is divided by this in view.ts, we want to end up with something like:
  // karma-part * (expWeight / exponentialTerm + hypWeight / hyperbolicTerm)
  // This requires some algebra here because we are dividing instead of multiplying:
  // == karma-part / ((exponentialTerm * hyperbolicTerm) / (expWeight * hyperbolicTerm + hypWeight * exponentialTerm))
  const numerator = { $multiply: [exponentialTerm, hyperbolicTerm] };
  const denominator = { $add: [
    { $multiply: [expWeight, hyperbolicTerm] },
    { $multiply: [hypWeight, exponentialTerm] },
  ] };
  return { $divide: [numerator, denominator] };
}

// TODO rename or something
export const timeDecayExprLegacy = () => {
  return {$pow: [
    {$add: [
      {$divide: [
        {$subtract: [
          new Date(), '$postedAt' // Age in miliseconds
        ]},
        60 * 60 * 1000
      ] }, // Age in hours
      SCORE_BIAS,
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

/**
 * This implements the same formula as getSubforumCommentBonus above
 */
export const commentScoreModifiers = () => {
  const {base, magnitude, duration, exponent} = getSubforumScoreBoost();

  const ageHoursExpr = {
    $divide: [
      {
        $subtract: [
          new Date(),
          "$createdAt",
        ],
      },
      3600000,
    ],
  };

  const bonusExpr = {
    $multiply: [
      magnitude,
      {
        $subtract: [
          1,
          {
            $pow: [
              {$divide: [ageHoursExpr, duration]},
              exponent,
            ],
          },
        ],
      },
    ],
  };

  return [
    {$cond: {
      if: {tagCommentType: "SUBFORUM"},
      then: {$max: [base, bonusExpr]},
      else: 0,
    }},
  ];
};
