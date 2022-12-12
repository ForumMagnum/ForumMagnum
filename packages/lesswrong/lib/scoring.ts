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

const getSubforumScoreBoost = (): SubforumCommentBonus => {
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
// modifier functions below
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
    const newScore = Math.round((baseScore / Math.pow(ageInHours + 2, TIME_DECAY_FACTOR.get()))*1000000)/1000000;

    return newScore;
  } else {
    return item.baseScore;
  }
};

export const timeDecayExpr = () => {
  return {$pow: [
    {$add: [
      {$divide: [
        {$subtract: [
          new Date(), '$postedAt' // Age in miliseconds
        ]},
        60 * 60 * 1000
      ] }, // Age in hours
      2
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
