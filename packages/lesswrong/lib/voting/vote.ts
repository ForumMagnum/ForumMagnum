import { CallbackHook, CallbackChainHook } from '../vulcan-lib/callbacks';
import { userCanDo } from '../vulcan-users/permissions';
import { recalculateScore } from '../scoring';
import {voteTypes, calculateVotePower, VoteDimensionString, voteDimensions} from './voteTypes';

export interface VoteDocTuple {
  newDocument: DbVoteableType
  vote: DbVote
}
export const voteCallbacks = {
  cancelSync: new CallbackChainHook<VoteDocTuple,[CollectionBase<DbVoteableType>,DbUser]>("votes.cancel.sync"),
  cancelAsync: new CallbackHook<[VoteDocTuple,CollectionBase<DbVoteableType>,DbUser]>("votes.cancel.async"),
  castVoteSync: new CallbackChainHook<VoteDocTuple,[CollectionBase<DbVoteableType>,DbUser]>("votes.castVote.sync"),
  castVoteAsync: new CallbackHook<[VoteDocTuple,CollectionBase<DbVoteableType>,DbUser]>("votes.castVote.async"),
};


// Given a client-side view of a document, return a modified version in which
// the user has voted and the scores are updated appropriately.
const addVoteClient = ({ document, collection, voteType, voteDimension, user }: {
  document: VoteableTypeClient,
  collection: CollectionBase<DbObject>,
  voteType: string,
  voteDimension: VoteDimensionString,
  user: UsersCurrent,
}) => {
  const power = getVotePower({user, voteType: voteType[voteDimension], voteDimension, document});
  const isAfVote = (document.af && userCanDo(user, "votes.alignment"))
  const afPower = isAfVote ? calculateVotePower(user.afKarma, voteType[voteDimension]) : 0;

  const newDocument = {
    ...document,
    currentUserVote: voteType,
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
const cancelVoteClient = ({document, voteDimension, collection, user}: {
  document: VoteableTypeClient,
  voteDimension: VoteDimensionString,
  collection: CollectionBase<DbObject>,
  user: UsersCurrent,
}): VoteableTypeClient => {
  if (!document.currentUserVote)
    return document;
  
  // Compute power for the vote being removed. Note that this is not quite
  // right if the user's vote weight has changed; the eager update will remove
  // points based on the user's new vote weight, which will then be corrected
  // when the server responds.
  const voteType = document.currentUserVote;
  const power = getVotePower({user, voteType: voteType[voteDimension], voteDimension, document});
  const isAfVote = (document.af && userCanDo(user, "votes.alignment"))
  const afPower = isAfVote ? calculateVotePower(user.afKarma, voteType[voteDimension]) : 0;
  
  const newDocument = {
    ...document,
    currentUserVote: null,
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
export const getVotePower = ({ user, voteType, voteDimension, document }: {
  user: DbUser|UsersCurrent,
  voteType: string|Record<string,string>,
  voteDimension: VoteDimensionString,
  document: VoteableType,
}) => {
  
  const votedType = (typeof voteType === "string") ? voteType : voteType[voteDimension] 
  
  const power = (voteTypes[votedType]?.power) || 1;
  return typeof power === 'function' ? power(user, document) : power;
};

// Create new vote object
export const createVote = ({ document, collectionName, voteType, voteDimension, user, voteId }: {
  document: VoteableType,
  collectionName: CollectionNameString,
  voteType: string|Record<string,string>,
  voteDimension: VoteDimensionString,
  user: DbUser|UsersCurrent,
  voteId?: string,
}) => {
  if (!document.userId)
    throw new Error("Voted-on document does not have an author userId?");
  
  return {
    // when creating a vote from the server, voteId can sometimes be undefined
    ...(voteId ? {_id:voteId} : undefined),
    
    documentId: document._id,
    collectionName,
    userId: user._id,
    voteType: {[voteDimension]: voteType},
    power: {[voteDimension]: getVotePower({user, voteType, voteDimension, document})},
    votedAt: new Date(),
    authorId: document.userId,
    cancelled: false,
    documentIsAf: !!(document.af),
  }
};

// Optimistic response for votes
export const setVoteClient = async ({ document, collection, voteType, voteDimension, user }: {
  document: VoteableTypeClient,
  collection: CollectionBase<DbVoteableType>
  voteType: string|null,
  voteDimension: VoteDimensionString
  user: UsersCurrent,
}): Promise<VoteableTypeClient> => {
  if (voteType && !voteTypes[voteType]) throw new Error("Invalid vote type");
  const collectionName = collection.options.collectionName;

  // make sure item and user are defined
  if (!document || !user || (voteType && !userCanDo(user, `${collectionName.toLowerCase()}.${voteType}`))) {
    throw new Error(`Cannot vote on '${collectionName.toLowerCase()}`);
  }

  if (!voteType) {
    return cancelVoteClient({document, voteDimension, collection, user});
  } else {
    document = cancelVoteClient({document, voteDimension, collection, user})
    return addVoteClient({document, collection, voteType, voteDimension, user});
  }
}

