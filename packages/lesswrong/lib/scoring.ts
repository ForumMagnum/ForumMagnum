import { getSetting } from './vulcan-lib';
import Votes from './collections/votes/collection';

export const TIME_DECAY_FACTOR = getSetting('timeDecayFactor', 1.15); //LW: Set this to 1.15 from 1.3 for LW purposes (want slower decay)
// Basescore bonuses for various categories
export const FRONTPAGE_BONUS = 10;
export const FEATURED_BONUS = 10;


export const recalculateBaseScore = (document) => {
  const votes = Votes.find(
    {
      documentId: document._id,
      cancelled: false
    }
  ).fetch() || [];
  return votes.reduce((sum, vote) => { return vote.power + sum}, 0)
}

export const recalculateScore = item => {
  // Age Check
  if (item.postedAt) {
    const postedAt = item.postedAt.valueOf();
    const now = new Date().getTime();
    const age = now - postedAt;
    const ageInHours = age / (60 * 60 * 1000);

    // use baseScore if defined, if not just use 0
    let baseScore = item.baseScore || 0;

    baseScore = baseScore + ((item.frontpageDate ? FRONTPAGE_BONUS : 0) + (item.curatedDate ? FEATURED_BONUS : 0));

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
    {$cond: {if: "$curatedDate", then: FEATURED_BONUS, else: 0}}
  ];
};

