import { runCallbacks } from '../vulcan-lib';
import { userCanDo } from '../vulcan-users/permissions';
import { recalculateScore } from '../scoring';
import * as _ from 'underscore';

interface VoteTypeOptions {
  power: number|((user: DbUser|UsersCurrent, document: VoteableType)=>number),
  exclusive: boolean
}

// Define voting operations
export const voteTypes: Partial<Record<string,VoteTypeOptions>> = {}

// Add new vote types
export const addVoteType = (voteType: string, voteTypeOptions: VoteTypeOptions) => {
  voteTypes[voteType] = voteTypeOptions;
}

addVoteType('upvote', {power: 1, exclusive: true});
addVoteType('downvote', {power: -1, exclusive: true});

// Test if a user has voted on the client
export const hasVotedClient = ({userVotes, voteType}: {
  userVotes: Array<VoteMinimumInfo>,
  voteType: string,
}) => {
  if (voteType) {
    return _.where(userVotes, { voteType }).length
  } else {
    return userVotes && userVotes.length
  }
}

// Calculate total power of all a user's votes on a document
const calculateTotalPower = (votes: Array<VoteFragment>) => _.pluck(votes, 'power').reduce((a: number, b: number) => a + b, 0);


// Add a vote of a specific type on the client
const addVoteClient = ({ document, collection, voteType, user, voteId }: {
  document: VoteableTypeClient,
  collection: CollectionBase<DbObject>,
  voteType: string,
  user: UsersCurrent,
  voteId?: string,
}) => {

  const newDocument = {
    ...document,
    baseScore: document.baseScore || 0,
    __typename: collection.options.typeName,
    currentUserVotes: document.currentUserVotes || [],
  };

  // create new vote and add it to currentUserVotes array
  const vote = createVote({ document, collectionName: collection.options.collectionName, voteType, user, voteId });
  // cast to VoteFragment needed because of missing _id
  newDocument.currentUserVotes = [...newDocument.currentUserVotes, vote as VoteFragment];
  newDocument.voteCount = (newDocument.voteCount||0) + 1;

  // increment baseScore
  newDocument.baseScore += vote.power;
  newDocument.score = recalculateScore(newDocument);

  return newDocument;
}


// Cancel votes of a specific type on a given document (client)
const cancelVoteClient = ({ document, voteType }: {
  document: VoteableTypeClient,
  voteType: string,
}) => {
  const vote: any = _.findWhere(document.currentUserVotes, { voteType });
  const newDocument = _.clone(document);
  if (vote) {
    // subtract vote scores
    newDocument.baseScore -= vote.power;
    newDocument.score = recalculateScore(newDocument);

    newDocument.voteCount--;
    
    const newVotes = _.reject(document.currentUserVotes, (vote: any) => vote.voteType === voteType);

    // clear out vote of this type
    newDocument.currentUserVotes = newVotes;

  }
  return newDocument;
}

// Clear *all* votes for a given document and user (client)
const clearVotesClient = ({ document }: {
  document: VoteableTypeClient,
}) => {
  const newDocument = _.clone(document);
  newDocument.baseScore -= calculateTotalPower(document.currentUserVotes);
  newDocument.score = recalculateScore(newDocument);
  newDocument.voteCount -= newDocument.currentUserVotes.length
  newDocument.currentUserVotes = [];
  return newDocument
}


// Determine a user's voting power for a given operation.
// If power is a function, call it on user
const getVotePower = ({ user, voteType, document }: {
  user: DbUser|UsersCurrent,
  voteType: string,
  document: VoteableType,
}) => {
  const power = (voteTypes[voteType]?.power) || 1;
  return typeof power === 'function' ? power(user, document) : power;
};

// Create new vote object
export const createVote = ({ document, collectionName, voteType, user, voteId }: {
  document: VoteableType,
  collectionName: CollectionNameString,
  voteType: string,
  user: DbUser|UsersCurrent,
  voteId?: string,
}) => {

  if (!document.userId)
    throw new Error("Voted-on document does not have an author userId?");
  
  const vote = {
    // when creating a vote from the server, voteId can sometimes be undefined
    ...(voteId ? {_id:voteId} : undefined),
    
    documentId: document._id,
    collectionName,
    userId: user._id,
    voteType: voteType,
    power: getVotePower({user, voteType, document}),
    votedAt: new Date(),
    authorId: document.userId,
    cancelled: false,
    documentIsAf: !!(document.af),
    __typename: 'Vote'
  }

  return vote;

};

// Optimistic response for votes
export const performVoteClient = ({ document, collection, voteType = 'upvote', user, voteId }: {
  document: VoteableTypeClient,
  collection: CollectionBase<DbObject>
  voteType?: string,
  user: UsersCurrent,
  voteId?: string,
}) => {
  if (!voteTypes[voteType]) throw new Error("Invalid vote type");
  const collectionName = collection.options.collectionName;
  let returnedDocument;

  // make sure item and user are defined
  if (!document || !user || !userCanDo(user, `${collectionName.toLowerCase()}.${voteType}`)) {
    throw new Error(`Cannot perform operation '${collectionName.toLowerCase()}.${voteType}'`);
  }

  let voteOptions = {document, collection, voteType, user, voteId};

  if (hasVotedClient({userVotes: document.currentUserVotes, voteType})) {
    returnedDocument = cancelVoteClient(voteOptions);
    returnedDocument = runCallbacks({
      name: `votes.cancel.client`,
      iterator: returnedDocument,
      properties: [collection, user, voteType]
    });
  } else {
    if (voteTypes[voteType]?.exclusive) {
      const tempDocument = runCallbacks({
        name: `votes.clear.client`,
        iterator: voteOptions.document,
        properties: [collection, user]
      });
      voteOptions.document = clearVotesClient({document:tempDocument})

    }
    returnedDocument = addVoteClient(voteOptions);
    returnedDocument = runCallbacks({
      name: `votes.${voteType}.client`,
      iterator: returnedDocument,
      properties: [collection, user, voteType]
    });
  }

  return returnedDocument;
}

