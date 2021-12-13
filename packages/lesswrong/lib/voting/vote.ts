import { CallbackHook, CallbackChainHook } from '../vulcan-lib/callbacks';
import { userCanDo } from '../vulcan-users/permissions';
import { recalculateScore } from '../scoring';
import {voteTypes, calculateVotePower, VoteTypesRecordType, VoteDimensionString} from './voteTypes';
import * as _ from 'underscore';

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

const createNewDocument = ({document, collection, voteType, voteDimension, user, direction}: {
  document: VoteableTypeClient,
  collection: CollectionBase<DbObject>,
  voteType: string,
  voteDimension: VoteDimensionString,
  user: UsersCurrent,
  direction: "add"|"cancel",
}) => {

  // Compute power for the vote being removed. Note that this is not quite
  // right if the user's vote weight has changed; the eager update will remove
  // points based on the user's new vote weight, which will then be corrected
  // when the server responds.
  const multiplier = direction === 'add' ? 1 : -1
  const power = getVotePower({user, voteType, document});
  const isAfVote = (document.af && userCanDo(user, "votes.alignment"))
  const afPower = isAfVote ? calculateVotePower(user.afKarma, voteType) : 0;
  
  const overallAggregates = voteDimension === 'Overall' ?
    {
      currentUserVote: direction === 'add' ? voteType : null,
      baseScore: (document.baseScore||0) + (multiplier * power),
      afBaseScore: (document.afBaseScore||0) + (multiplier * afPower),
      voteCount: (document.voteCount||0) + (multiplier * 1),
      afVoteCount: (document.afVoteCount||0) + (multiplier * (isAfVote?1:0)),
    } : {}

    // console.log({multiplier})
    // console.log({power})
    // console.log({direction})

  const otherDimensionAggregates = {
    currentUserVotesRecord: { ...document.currentUserVotesRecord, [voteDimension]: direction === 'add' ? voteType : null},
    baseScoresRecord: {...document.baseScoresRecord, [voteDimension]: (document?.baseScoresRecord?.[voteDimension] || 0) + (multiplier * power)},
    voteCountsRecord: {...document.voteCountsRecord, [voteDimension]: (document?.voteCountsRecord?.[voteDimension] || 0) + (multiplier * 1)},
  }

  // console.log({otherDimensionAggregates})
  // console.log('document.voteCount', document.voteCount)
  // console.log('document.voteCountsRecord', document.voteCountsRecord)
  // console.log('document.voteCountsRecord?.[voteDimension]', document.voteCountsRecord?.[voteDimension])

  const newDocument = {
    ...document,
    ...overallAggregates,
    ...otherDimensionAggregates
  };
  newDocument.score = recalculateScore(newDocument);
  // console.log({newDocument})
  return newDocument;
}

// Given a client-side view of a document, return a modified version in which
// the user has voted and the scores are updated appropriately.
const addVoteClient = ({ document, collection, voteType, voteDimension, user }: {
  document: VoteableTypeClient,
  collection: CollectionBase<DbObject>,
  voteType: string,
  voteDimension: VoteDimensionString,
  user: UsersCurrent,
}) => {
  // const power = getVotePower({user, voteType: voteType[voteDimension], document});
  // const isAfVote = (document.af && userCanDo(user, "votes.alignment"))
  // const afPower = isAfVote ? calculateVotePower(user.afKarma, voteType[voteDimension]) : 0;

  // const newDocument = {
  //   ...document,
  //   currentUserVote: document.currentUserVote,
  //   currentUserVotesRecord: { ...document.currentUserVotesRecord, voteDimension: voteType},
  //   baseScore: (document.baseScore||0) + power,
  //   baseScoresRecord: {...document.baseScoresRecord, voteDimension: (document?.baseScoresRecord?.[voteDimension] || 0) + power},
  //   voteCount: (document.voteCount||0) + 1,
  //   voteCountsRecord: {...document.voteCountsRecord, voteDimension: (document?.voteCountsRecord?.[voteDimension] || 0) + 1},
  //   afBaseScore: (document.afBaseScore||0) + afPower,
  //   afVoteCount: (document.afVoteCount||0) + (isAfVote?1:0),
  //   __typename: collection.options.typeName,
  // };
  // newDocument.score = recalculateScore(newDocument);
  return createNewDocument({ document, collection, voteType, voteDimension, user, direction: 'add' });
}


// Given a client-side view of a document, return a modified version in which
// the current user's vote is removed and the score is adjusted accordingly.
const cancelVoteClient = ({document, voteDimension, collection, user}: {
  document: VoteableTypeClient,
  voteDimension: VoteDimensionString,
  collection: CollectionBase<DbObject>,
  user: UsersCurrent,
}): VoteableTypeClient => {
  const voteType = voteDimension === 'Overall' ?
    document.currentUserVote :
    document.currentUserVotesRecord?.[voteDimension]
  if (!voteType) {
    throw new Error("Can't cancel a vote that doesn't have a voteType")
  }
  return createNewDocument({ document, collection, voteType, voteDimension, user, direction: 'cancel' });
}


// Determine a user's voting power for a given operation.
// If power is a function, call it on user
export const getVotePower = ({ user, voteType, document }: {
  user: DbUser|UsersCurrent,
  voteType: string|null|undefined,
  document: VoteableType,
}) => {
  if (!voteType) return 0

  const power = (voteTypes[voteType]?.power) || 1;
  // console.log(`getVotePower voteType: ${voteType}`)
  // console.log(`getVotePower power: ${typeof power === 'function' ? power(user, document) : power}`)
  return typeof power === 'function' ? power(user, document) : power;
};

export const getPowersRecord = ({ user, voteTypesRecord, document }: {
  user: DbUser|UsersCurrent,
  voteTypesRecord: VoteTypesRecordType,
  document: VoteableType,
}) => {
  return _.mapObject(voteTypesRecord, (voteType, key) => getVotePower({user, voteType, document}))
};

// Create new vote object
export const createVote = ({ document, collectionName, voteType, voteTypesRecord, user, voteId }: {
  document: VoteableType,
  collectionName: CollectionNameString,
  voteType: string|null,
  voteTypesRecord: VoteTypesRecordType,
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
    voteType: voteType || undefined, // TODO: is there a better way to do this?
    voteTypesRecord,
    power: getVotePower({user, voteType, document}),
    powersRecord: getPowersRecord({user, voteTypesRecord, document}),
    votedAt: new Date(),
    authorId: document.userId,
    cancelled: false,
    documentIsAf: !!(document.af)
  }
};

// Optimistic response for votes
export const setVoteClient = async ({ document, collection, voteType, voteDimension, user, direction }: {
  document: VoteableTypeClient,
  collection: CollectionBase<DbVoteableType>
  voteType: string,
  voteDimension: VoteDimensionString,
  user: UsersCurrent,
  direction: 'add'|'cancel'
}): Promise<VoteableTypeClient> => {
  if (voteType && !voteTypes[voteType]) throw new Error("Invalid vote type");
  const collectionName = collection.options.collectionName;

  // make sure item and user are defined
  if (!document || !user || (voteType && !userCanDo(user, `${collectionName.toLowerCase()}.${voteType}`))) {
    throw new Error(`Cannot vote on '${collectionName.toLowerCase()}`);
  }

  const hasVoted = (voteDimension === 'Overall' ? document.currentUserVote : document.currentUserVotesRecord?.[voteDimension])
  console.log({hasVoted})
  console.log({direction})

  if (hasVoted) {
    console.log('calling cancelVoteClient')
    console.log({voteDimension})
    document = cancelVoteClient({document, voteDimension, collection, user});
  }
  if (direction === 'add') {
    return addVoteClient({document, collection, voteType, voteDimension, user});
  } else {
    return document
  }
}
