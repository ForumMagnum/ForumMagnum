import { userCanDo } from '../vulcan-users/permissions';
import { recalculateScore } from '../scoring';
import { calculateVotePower, isValidVoteType } from './voteTypes';
import type { VotingSystem } from './votingSystems';
import { collectionNameToTypeName } from '../generated/collectionTypeNames';
import { DatabasePublicSetting } from '../publicSettings';

export const karmaRewarderId100 = new DatabasePublicSetting<string | null>('karmaRewarderId100', null)
export const karmaRewarderId1000 = new DatabasePublicSetting<string | null>('karmaRewarderId1000', null)


export interface VoteDocTuple {
  newDocument: DbVoteableType
  vote: DbVote
}

// Given a client-side view of a document, return a modified version in which
// the user has voted and the scores are updated appropriately.
const addVoteClient = ({ document, collectionName, voteType, extendedVote, user, votingSystem }: {
  document: VoteableTypeClient,
  collectionName: CollectionNameString,
  voteType: string,
  extendedVote: any,
  user: UsersCurrent,
  votingSystem: VotingSystem,
}) => {
  const power = getVotePower({user, voteType: voteType ?? "neutral", document});
  const isAfVote = (document.af && userCanDo(user, "votes.alignment"))
  const afPower = isAfVote ? calculateVotePower(user.afKarma, voteType ?? "neutral") : 0;

  const newDocument = {
    ...document,
    currentUserVote: voteType,
    currentUserExtendedVote: extendedVote,
    extendedScore: votingSystem.addVoteClient({
      voteType: voteType,
      document,
      oldExtendedScore: document.extendedScore,
      extendedVote: extendedVote,
      currentUser: user
    }),
    afExtendedScore: isAfVote ? votingSystem.addVoteClient({
      voteType: voteType,
      document,
      oldExtendedScore: document.afExtendedScore,
      extendedVote: extendedVote,
      currentUser: user
    }): document.afExtendedScore,
    baseScore: (document.baseScore||0) + power,
    voteCount: (document.voteCount||0) + 1,
    afBaseScore: (document.afBaseScore||0) + afPower,
    afVoteCount: (document.afVoteCount||0) + (isAfVote?1:0),
    __typename: collectionNameToTypeName[collectionName],
  };

  newDocument.score = recalculateScore(newDocument);
  return newDocument;
}

// Given a client-side view of a document, return a modified version in which
// the current user's vote is removed and the score is adjusted accordingly.
const cancelVoteClient = ({document, collectionName, user, votingSystem}: {
  document: VoteableTypeClient,
  collectionName: CollectionNameString,
  user: UsersCurrent,
  votingSystem: VotingSystem,
}): VoteableTypeClient => {
  if (!document.currentUserVote)
    return document;
  
  // Compute power for the vote being removed. Note that this is not quite
  // right if the user's vote weight has changed; the eager update will remove
  // points based on the user's new vote weight, which will then be corrected
  // when the server responds.
  const voteType = document.currentUserVote;
  const power = getVotePower({user, voteType: voteType ?? "neutral", document});
  const isAfVote = (document.af && userCanDo(user, "votes.alignment"))
  const afPower = isAfVote ? calculateVotePower(user.afKarma, voteType ?? "neutral") : 0;
  
  const newDocument = {
    ...document,
    currentUserVote: null,
    currentUserExtendedVote: null,
    extendedScore: votingSystem.cancelVoteClient({
      voteType: document.currentUserVote,
      document,
      oldExtendedScore: document.extendedScore,
      cancelledExtendedVote: document.currentUserExtendedVote,
      currentUser: user
    }),
    afExtendedScore: isAfVote ? votingSystem.cancelVoteClient({
      voteType: document.currentUserVote,
      document,
      oldExtendedScore: document.afExtendedScore,
      cancelledExtendedVote: document.currentUserExtendedVote,
      currentUser: user
    }) : document.afExtendedScore,
    baseScore: (document.baseScore||0) - power,
    afBaseScore: (document.afBaseScore||0) - afPower,
    voteCount: (document.voteCount||0)-1,
    afVoteCount: (document.afVoteCount||0) - (isAfVote?1:0),
  };
  newDocument.score = recalculateScore(newDocument);
  
  return newDocument;
}

// Determine a user's voting power for a given operation.
// If power is a function, call it on user
export const getVotePower = ({ user, voteType, document }: {
  user: DbUser|UsersCurrent,
  voteType: string,
  document: VoteableType,
}) => {
  const userKarma = user.karma;
  if (user._id === karmaRewarderId100.get()) return 100;
  if (user._id === karmaRewarderId1000.get()) return 1000;
  return calculateVotePower(userKarma, voteType);
};

// Optimistic response for votes
export const setVoteClient = async ({ document, collectionName, voteType = 'neutral', extendedVote=null, user, votingSystem }: {
  document: VoteableTypeClient,
  collectionName: CollectionNameString,
  voteType: string,
  extendedVote?: any,
  user: UsersCurrent,
  votingSystem: VotingSystem,
}): Promise<VoteableTypeClient> => {
  if (voteType && !isValidVoteType(voteType)) throw new Error(`Invalid vote type in setVoteClient: ${voteType}`);

  // make sure item and user are defined
  if (!document || !user || (!extendedVote && voteType && voteType !== "neutral" && !userCanDo(user, `${collectionName.toLowerCase()}.${voteType}`))) {
    throw new Error(`Cannot vote on '${collectionName.toLowerCase()}`);
  }
  
  if (document.currentUserVote) {
    document = cancelVoteClient({document, collectionName, user, votingSystem});
  }
  if (voteType || extendedVote) {
    document = addVoteClient({document, collectionName, voteType, extendedVote, user, votingSystem});
  }
  return document;
}
