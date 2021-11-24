import Votes from './collections/votes/collection';
import { DatabasePublicSetting } from './publicSettings';
import { voteDimensions } from "./voting/voteTypes";

const timeDecayFactorSetting = new DatabasePublicSetting<number>('timeDecayFactor', 1.15)
const frontpageBonusSetting = new DatabasePublicSetting<number>('frontpageScoreBonus', 10)
const curatedBonusSetting = new DatabasePublicSetting<number>('curatedScoreBonus', 10)

export const TIME_DECAY_FACTOR = timeDecayFactorSetting;
// Basescore bonuses for various categories
export const FRONTPAGE_BONUS = frontpageBonusSetting;
export const CURATED_BONUS = curatedBonusSetting;


export const recalculateBaseScore = async (document: VoteableType) => {
  const votes = await Votes.find(
    {
      documentId: document._id,
      cancelled: false
    }
  ).fetch() || [];
  
  const getVotePower = (vote: DbVote) => {
    if (typeof vote.power === "number") return vote.power
    return vote.power["Overall"]
  }
  
  return votes.reduce((sum, vote) => { return getVotePower(vote) + sum}, 0)
}

export const recalculateAggregateScores = async (document: VoteableType) => {
  const votes = await Votes.find(
    {
      documentId: document._id,
      cancelled: false
    }
  ).fetch() || [];
  
  const addToAgg = (aggregator, vote: DbVote) => {
    for (const dimension in voteDimensions) {
      aggregator[dimension] = aggregator[dimension] + vote[dimension]
    }
    return aggregator
  }
  
  const aggregator = voteDimensions.reduce((o, dimension) => ({...o, [dimension]: 0}), {}) 
  console.log({aggregator})
  
  return votes.reduce( (agg, vote) => addToAgg(agg, vote), aggregator)
}

// NB: If you want to change this algorithm, make sure to also change the
// timeDecayExpr function below
export const recalculateScore = (item: VoteableType) => {
  // Age Check
  if ((item as any).postedAt) {
    const postedAt = (item as any).postedAt.valueOf();
    const now = new Date().getTime();
    const age = now - postedAt;
    const ageInHours = age / (60 * 60 * 1000);

    // use baseScore if defined, if not just use 0
    let baseScore = item.baseScore || 0;

    baseScore = baseScore + (((item as any).frontpageDate ? FRONTPAGE_BONUS.get() : 0) + ((item as any).curatedDate ? CURATED_BONUS.get() : 0));

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

export const defaultScoreModifiers = () => {
  return [
    {$cond: {if: "$frontpageDate", then: FRONTPAGE_BONUS.get(), else: 0}},
    {$cond: {if: "$curatedDate", then: CURATED_BONUS.get(), else: 0}}
  ];
};
