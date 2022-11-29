import { DatabasePublicSetting } from './publicSettings';

const timeDecayFactorSetting = new DatabasePublicSetting<number>('timeDecayFactor', 1.15)
const frontpageBonusSetting = new DatabasePublicSetting<number>('frontpageScoreBonus', 10)
const curatedBonusSetting = new DatabasePublicSetting<number>('curatedScoreBonus', 10)
const subforumCommentBoostSetting = new DatabasePublicSetting<number>('subforumCommentScoreBonus', 20);
const subforumCommentBoostHoursSetting = new DatabasePublicSetting<number>('subforumCommentScoreBonusHours', 8);

export const TIME_DECAY_FACTOR = timeDecayFactorSetting;
// Basescore bonuses for various categories
export const FRONTPAGE_BONUS = frontpageBonusSetting;
export const CURATED_BONUS = curatedBonusSetting;

const getSubforumScoreBoost = () => {
  return {
    magnitude: subforumCommentBoostSetting.get(),
    durationHours: subforumCommentBoostHoursSetting.get(),
  };
}

const getSubforumCommentBonus = (item: VoteableType) => {
  if ("tagCommentType" in item && item["tagCommentType"] === "SUBFORUM") {
    const {magnitude, durationHours} = getSubforumScoreBoost();
    const createdAt = (item as any).createdAt ?? new Date();
    const ageHours = (Date.now() - createdAt.getTime()) / 3600000;
    const factor = -magnitude / (durationHours * durationHours);
    const bias = factor * (ageHours - durationHours) * (ageHours + durationHours);
    return Math.max(0, bias);
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

export const commentScoreModifiers = () => {
  const {magnitude, durationHours} = getSubforumScoreBoost();

  // (Date.now() - createdAt.getTime()) / 3600000
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

  // -magnitude / (durationHours * durationHours);
  const factorExpr = {
    $multiply: [
      {
        $divide: [
          {$subtract: [0, magnitude]},
          durationHours * durationHours,
        ],
      },
    ],
  };

  // factor * (ageHours - durationHours) * (ageHours + durationHours)
  const biasExpr = {
    $multiply: [
      factorExpr,
      {$subtract: [ageHoursExpr, durationHours]},
      {$add: [ageHoursExpr, durationHours]},
    ],
  };

  return [
    {$cond: {
      if: {tagCommentType: "SUBFORUM"},
      then: {$max: [0, biasExpr]},
      else: 0,
    }},
  ];
};
