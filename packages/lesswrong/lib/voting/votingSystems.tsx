import { calculateVotePower, getVoteAxisStrength } from './voteTypes';
import { eaEmojiNames } from './eaEmojiPalette';
import { loadByIds } from '../loaders';
import { filterNonnull } from '../utils/typeGuardUtils';
import sumBy from 'lodash/sumBy'
import uniq from 'lodash/uniq';
import keyBy from 'lodash/keyBy';
import pickBy from 'lodash/pickBy';
import fromPairs from 'lodash/fromPairs';
import { defineVotingSystem } from './defineVotingSystem';
import { emojiReactions, reactBallotAxes, reactBallotStandaloneReactions } from './constants';

export const defaultVotingSystem = defineVotingSystem({
  name: "default",
  description: "Reddit-style up/down with strongvotes",
  addVoteClient: ({oldExtendedScore, extendedVote, currentUser}: {oldExtendedScore: AnyBecauseTodo, extendedVote: AnyBecauseTodo, currentUser: UsersCurrent}): AnyBecauseTodo => {
    return null;
  },
  cancelVoteClient: ({oldExtendedScore, cancelledExtendedVote, currentUser}: {oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    return null;
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    return null;
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    return false;
  },
});

export const twoAxisVotingSystem = defineVotingSystem({
  name: "twoAxis",
  description: "Default (Two-Axis Approve and Agree)",
  userCanActivate: () => true,
  addVoteClient: ({voteType, document, oldExtendedScore, extendedVote, currentUser}: {voteType: string|null, document: VoteableTypeClient, oldExtendedScore: AnyBecauseTodo, extendedVote: AnyBecauseTodo, currentUser: UsersCurrent}): AnyBecauseTodo => {
    const newAgreementPower = calculateVotePower(currentUser.karma, extendedVote?.agreement||"neutral");
    const oldApprovalVoteCount = (oldExtendedScore && "approvalVoteCount" in oldExtendedScore) ? oldExtendedScore.approvalVoteCount : document.voteCount;
    const newVoteIncludesApproval = (voteType&&voteType!=="neutral");
    
    return {
      approvalVoteCount: oldApprovalVoteCount + (newVoteIncludesApproval?1:0),
      agreement: (oldExtendedScore?.agreement||0) + newAgreementPower,
      agreementVoteCount: (oldExtendedScore?.agreementVoteCount||0) + 1,
    };
  },
  cancelVoteClient: ({voteType, document, oldExtendedScore, cancelledExtendedVote, currentUser}: {voteType: string|null, document: VoteableTypeClient, oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    const oldVoteAgreement: string | undefined = cancelledExtendedVote?.agreement;
    const oldVoteIncludesAgreement = (oldVoteAgreement && oldVoteAgreement!=="neutral");
    const oldAgreementPower = oldVoteIncludesAgreement ? calculateVotePower(currentUser.karma, oldVoteAgreement) : 0;
    const oldApprovalVoteCount = (oldExtendedScore && "approvalVoteCount" in oldExtendedScore) ? oldExtendedScore.approvalVoteCount : document.voteCount;
    const oldVoteIncludesApproval = (voteType&&voteType!=="neutral");
    
    return {
      approvalVoteCount: oldApprovalVoteCount - (oldVoteIncludesApproval?1:0),
      agreement: (oldExtendedScore?.agreement||0) - (oldVoteIncludesAgreement?oldAgreementPower:0),
      agreementVoteCount: (oldExtendedScore?.agreementVoteCount||0) - (oldVoteIncludesAgreement?1:0),
    };
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    const userIdsThatVoted = uniq(votes.map(v=>v.userId));
    const usersThatVoted = await loadByIds(context, "Users", userIdsThatVoted);
    const usersById = keyBy(filterNonnull(usersThatVoted), u=>u._id);
    
    const result = {
      approvalVoteCount: votes.filter(v=>(v.voteType && v.voteType!=="neutral")).length,
      agreement: sumBy(votes, v=>getVoteAxisStrength(v, usersById, "agreement")),
      agreementVoteCount: votes.filter(v=>getVoteAxisStrength(v, usersById, "agreement") !== 0).length,
    };
    return result;
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    return vote?.extendedVoteType?.agreement && vote.extendedVoteType.agreement !== "neutral";
  },
});

const reactBallotAxisNames = reactBallotAxes.map(axis=>axis.name);
const reactBallotStandaloneReactionNames = reactBallotStandaloneReactions.map(reaction => reaction.name);

export const reactsBallotVotingSystem = defineVotingSystem({
  name: "reactsBallot",
  description: "React-Ballots",
  addVoteClient: ({oldExtendedScore, extendedVote, currentUser}: {oldExtendedScore: any, extendedVote: any, currentUser: UsersCurrent}): any => {
    const axisScores = fromPairs(reactBallotAxisNames.map(axis => {
      const axisPower = calculateVotePower(currentUser.karma, extendedVote?.[axis]||"neutral");
      return [axis, (oldExtendedScore?.[axis]||0) + axisPower];
    }));
    const standaloneReactCounts = fromPairs(reactBallotStandaloneReactionNames.map(reaction => {
      const hasReaction = !!extendedVote?.[reaction];
      return [reaction, (oldExtendedScore?.[reaction]||0) + (hasReaction?1:0)];
    }));
    return filterZeroes({...axisScores, ...standaloneReactCounts});
  },
  cancelVoteClient: ({oldExtendedScore, cancelledExtendedVote, currentUser}: {oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    const axisScores = fromPairs(reactBallotAxisNames.map(axis => {
      const oldVote: string | undefined = cancelledExtendedVote?.[axis];
      const oldScore = (oldExtendedScore?.[axis]||0);
      if (!oldVote || oldVote==="neutral") return [axis, oldScore];
      const oldAxisPower = calculateVotePower(currentUser.karma, oldVote);
      return [axis, oldScore - oldAxisPower];
    }));
    const standaloneReactCounts = fromPairs(reactBallotStandaloneReactionNames.map(reaction => {
      const oldVote = !!cancelledExtendedVote?.[reaction];
      return [reaction, oldExtendedScore?.[reaction] - (oldVote?1:0)];
    }));
    return filterZeroes({...axisScores, ...standaloneReactCounts});
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    const userIdsThatVoted = uniq(votes.map(v=>v.userId));
    const usersThatVoted = await loadByIds(context, "Users", userIdsThatVoted);
    const usersById = keyBy(filterNonnull(usersThatVoted), u=>u._id);
    
    const axisScores = fromPairs(reactBallotAxisNames.map(axis => {
      return [axis, sumBy(votes, v => getVoteAxisStrength(v, usersById, axis))];
    }))
    const standaloneReactCounts = fromPairs(reactBallotStandaloneReactionNames.map(reaction => {
      return [reaction, sumBy(votes, v => v?.extendedVoteType?.[reaction] ? 1 : 0)];
    }));
    
    return filterZeroes({ ...axisScores, ...standaloneReactCounts });
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    if (!vote.extendedVoteType) return false;
    for (let key of Object.keys(vote.extendedVoteType)) {
      if (vote.extendedVoteType[key] && vote.extendedVoteType[key]!=="neutral")
        return true;
    }
    return false;
  },
});

const emojiReactionNames = emojiReactions.map(reaction => reaction.name)

export const emojiReactionsVotingSystem = defineVotingSystem({
  name: "emojiReactions",
  description: "Emoji reactions",
  addVoteClient: ({oldExtendedScore, extendedVote, currentUser}: {oldExtendedScore: any, extendedVote: any, currentUser: UsersCurrent}): any => {
    const emojiReactCounts = fromPairs(emojiReactionNames.map(reaction => {
      const hasReaction = !!extendedVote?.[reaction];
      return [reaction, (oldExtendedScore?.[reaction]||0) + (hasReaction?1:0)];
    }));
    return filterZeroes({...emojiReactCounts});
  },
  cancelVoteClient: ({oldExtendedScore, cancelledExtendedVote, currentUser}: {oldExtendedScore: any, cancelledExtendedVote: any, currentUser: UsersCurrent}): any => {
    const emojiReactCounts = fromPairs(emojiReactionNames.map(reaction => {
      const oldVote = !!cancelledExtendedVote?.[reaction];
      return [reaction, oldExtendedScore?.[reaction] - (oldVote?1:0)];
    }));
    return filterZeroes({...emojiReactCounts});
  },
  computeExtendedScore: async (votes: DbVote[], context: ResolverContext) => {
    const emojiReactCounts = fromPairs(emojiReactionNames.map(reaction => {
      return [reaction, sumBy(votes, v => v?.extendedVoteType?.[reaction] ? 1 : 0)];
    }));
    
    return filterZeroes({...emojiReactCounts });
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    if (!vote.extendedVoteType) return false;
    for (let key of Object.keys(vote.extendedVoteType)) {
      if (vote.extendedVoteType[key] && vote.extendedVoteType[key]!=="neutral")
        return true;
    }
    return false;
  },
});

const getEmojiReactionPower = (value?: boolean) =>
  value === true ? 1 : 0;

export const eaEmojisVotingSystem = defineVotingSystem({
  name: "eaEmojis",
  description: "Approval voting, plus EA Forum emoji reactions",
  addVoteClient: ({oldExtendedScore, extendedVote, document, voteType}: {
    oldExtendedScore?: Record<string, number>,
    extendedVote?: Record<string, boolean>,
    currentUser: UsersCurrent,
    document: VoteableType,
    voteType: string | null,
  }): Record<string, number> => {
    const oldApprovalVoteCount =
      oldExtendedScore && "approvalVoteCount" in oldExtendedScore
        ? oldExtendedScore.approvalVoteCount
        : document.voteCount;
    const newVoteIncludesApproval = (voteType && voteType !== "neutral");
    const emojiReactCounts = fromPairs(eaEmojiNames.map((reaction) => {
      const power = getEmojiReactionPower(extendedVote?.[reaction]);
      return [reaction, (oldExtendedScore?.[reaction] || 0) + power];
    }));
    return {
      ...filterZeroes({...emojiReactCounts}),
      approvalVoteCount: oldApprovalVoteCount + (newVoteIncludesApproval ? 1 : 0),
    };
  },
  cancelVoteClient: ({oldExtendedScore, cancelledExtendedVote}: {
    oldExtendedScore?: Record<string, number>,
    cancelledExtendedVote?: Record<string, boolean>,
    currentUser: UsersCurrent,
  }): Record<string, number> => {
    const emojiReactCounts = fromPairs(eaEmojiNames.map((reaction) => {
      const oldVote = !!cancelledExtendedVote?.[reaction];
      const oldScore = oldExtendedScore?.[reaction] ?? 0;
      return [reaction, oldScore - (oldVote ? 1 : 0)];
    }));
    return filterZeroes({...emojiReactCounts});
  },
  computeExtendedScore: async (votes: DbVote[], _context: ResolverContext) => {
    const emojiReactCounts = fromPairs(eaEmojiNames.map(reaction => {
      return [reaction, sumBy(votes, (v) => v?.extendedVoteType?.[reaction] ? 1 : 0)];
    }));
    return filterZeroes({...emojiReactCounts });
  },
  isNonblankExtendedVote: (vote: DbVote) => {
    if (!vote.extendedVoteType) {
      return false;
    }
    for (let key of Object.keys(vote.extendedVoteType)) {
      if (vote.extendedVoteType[key] && vote.extendedVoteType[key] !== "neutral") {
        return true;
      }
    }
    return false;
  },
});

function filterZeroes(obj: any) {
  return pickBy(obj, v=>!!v);
}
