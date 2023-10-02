import { CallbackHook, CallbackChainHook } from '../vulcan-lib/callbacks';
import { userCanDo } from '../vulcan-users/permissions';
import { recalculateScore } from '../scoring';
import { voteTypes, calculateVotePower } from './voteTypes';
import type { VotingSystem } from './votingSystems';

export interface VoteDocTuple<T extends DbVoteableType = DbVoteableType> {
  newDocument: T
  vote: DbVote
}
export const voteCallbacks = {
  cancelSync: new CallbackChainHook<VoteDocTuple,[CollectionBase<DbVoteableType>,DbUser]>("votes.cancel.sync"),
  cancelAsync: new CallbackHook<[VoteDocTuple,CollectionBase<DbVoteableType>,DbUser]>("votes.cancel.async"),
  castVoteSync: new CallbackChainHook<VoteDocTuple,[CollectionBase<DbVoteableType>,DbUser]>("votes.castVote.sync"),
  castVoteAsync: new CallbackHook<[VoteDocTuple,CollectionBase<DbVoteableType>,DbUser,ResolverContext]>("votes.castVote.async"),
};

// Given a client-side view of a document, return a modified version in which
// the user has voted and the scores are updated appropriately.
const addVoteClient = <T extends DbObject>({ document, collection, voteType, extendedVote, user, votingSystem }: {
  document: VoteableTypeClient,
  collection: CollectionBase<T>,
  voteType: string,
  extendedVote: any,
  user: UsersCurrent,
  votingSystem: VotingSystem,
}) => {
  const power = getVotePower({user, voteType, document});
  const isAfVote = (document.af && userCanDo(user, "votes.alignment"))
  const afPower = isAfVote ? calculateVotePower(user.afKarma, voteType) : 0;

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
    __typename: collection.options.typeName,
  };

  newDocument.score = recalculateScore(newDocument);
  return newDocument;
}


// Given a client-side view of a document, return a modified version in which
// the current user's vote is removed and the score is adjusted accordingly.
const cancelVoteClient = <T extends DbObject>({document, collection, user, votingSystem}: {
  document: VoteableTypeClient,
  collection: CollectionBase<T>,
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
  const power = getVotePower({user, voteType, document});
  const isAfVote = (document.af && userCanDo(user, "votes.alignment"))
  const afPower = isAfVote ? calculateVotePower(user.afKarma, voteType) : 0;
  
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
  const power = (voteTypes[voteType]?.power) || 1;
  return typeof power === 'function' ? power(user, document) : power;
};

// Optimistic response for votes
export const setVoteClient = async ({ document, collection, voteType = 'neutral', extendedVote=null, user, votingSystem }: {
  document: VoteableTypeClient,
  collection: CollectionBase<DbVoteableType>
  voteType: string,
  extendedVote?: any,
  user: UsersCurrent,
  votingSystem: VotingSystem,
}): Promise<VoteableTypeClient> => {
  if (voteType && !voteTypes[voteType]) throw new Error(`Invalid vote type in setVoteClient: ${voteType}`);
  const collectionName = collection.options.collectionName;

  // make sure item and user are defined
  if (!document || !user || (!extendedVote && voteType && voteType !== "neutral" && !userCanDo(user, `${collectionName.toLowerCase()}.${voteType}`))) {
    throw new Error(`Cannot vote on '${collectionName.toLowerCase()}`);
  }
  
  if (document.currentUserVote) {
    document = cancelVoteClient({document, collection, user, votingSystem});
  }
  if (voteType || extendedVote) {
    document = addVoteClient({document, collection, voteType, extendedVote, user, votingSystem});
  }
  return document;
}
