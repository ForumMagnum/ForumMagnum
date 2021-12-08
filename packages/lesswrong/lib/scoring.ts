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
  return recalculateVoteTotals(document, (vote) => (vote.power))
}
export const recalculateVoteCount = async (document: VoteableType) => {
  return recalculateVoteTotals(document, (vote) => (vote.power !== 0 ? 1 : 0))
}

export const recalculateVoteTotals = async (document: VoteableType, incrementFunction: any) => {
  const votes = await Votes.find(
    {
      documentId: document._id,
      cancelled: false
    }
  ).fetch() || [];
  return votes.reduce((sum, vote) => ( sum + incrementFunction(vote)), 0)
}


export const recalculateBaseScoresRecord = async (document: VoteableType) => {
  return recalculateRecord(document, (power) => (power), recalculateBaseScore)
}

export const recalculateVoteCountsRecord = async (document: VoteableType) => {
  return recalculateRecord(document, (power) => {return power !== 0 ? 1 : 0}, (recalculateVoteCount))
}

export const recalculateRecord = async (document: VoteableType, incrementFunction: any, recalculateOverall: any) => {
  const votes = await Votes.find(
    {
      documentId: document._id,
      cancelled: false
    }
  ).fetch() || [];

  // Initialize aggregator
  const aggregator = Object.fromEntries(voteDimensions.map((el) => ([el, 0])))

  const addToAgg = (aggregator, vote: DbVote) => {
    return voteDimensions.reduce((agg, dimension) => {
      return {...agg, [dimension]: agg[dimension] + incrementFunction(vote?.powersRecord?.[dimension] || 0)}
    }, aggregator)
  }

  const record = votes.reduce( (agg, vote) => addToAgg(agg, vote), aggregator)
  record['Overall'] = await recalculateOverall(document)
  return record
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
