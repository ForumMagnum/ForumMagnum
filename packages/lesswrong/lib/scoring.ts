import Votes from './collections/votes/collection';
import { DatabasePublicSetting } from './publicSettings';

const timeDecayFactorSetting = new DatabasePublicSetting<number>('timeDecayFactor', 1.15)
const frontpageBonusSetting = new DatabasePublicSetting<number>('frontpageScoreBonus', 10)
const curatedBonusSetting = new DatabasePublicSetting<number>('curatedScoreBonus', 10)

export const TIME_DECAY_FACTOR = timeDecayFactorSetting.get();
// Basescore bonuses for various categories
export const FRONTPAGE_BONUS = frontpageBonusSetting.get();
export const CURATED_BONUS = curatedBonusSetting.get();


export const recalculateBaseScore = async (document: VoteableType) => {
  const votes = await Votes.find(
    {
      documentId: document._id,
      cancelled: false
    }
  ).fetch() || [];
  return votes.reduce((sum, vote) => { return vote.power + sum}, 0)
}

export const recalculateScore = (item: VoteableType) => {
  // Age Check
  if ((item as any).postedAt) {
    const postedAt = (item as any).postedAt.valueOf();
    const now = new Date().getTime();
    const age = now - postedAt;
    const ageInHours = age / (60 * 60 * 1000);

    // use baseScore if defined, if not just use 0
    let baseScore = item.baseScore || 0;

    baseScore = baseScore + (((item as any).frontpageDate ? FRONTPAGE_BONUS : 0) + ((item as any).curatedDate ? CURATED_BONUS : 0));

    // HN algorithm
    const newScore = Math.round((baseScore / Math.pow(ageInHours + 2, TIME_DECAY_FACTOR))*1000000)/1000000;

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
    TIME_DECAY_FACTOR
  ]}
}

export const defaultScoreModifiers = () => {
  return [
    {$cond: {if: "$frontpageDate", then: FRONTPAGE_BONUS, else: 0}},
    {$cond: {if: "$curatedDate", then: CURATED_BONUS, else: 0}}
  ];
};

