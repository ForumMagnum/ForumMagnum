import { debug, debugGroup, debugGroupEnd, Connectors, runCallbacks, runCallbacksAsync } from 'meteor/vulcan:core';
import Votes from '../lib/collections/votes/collection.js';
import Users from 'meteor/vulcan:users';
import { recalculateScore, recalculateBaseScore } from '../lib/modules/scoring.js';
import { createError } from 'apollo-errors';
import { voteTypes, createVote } from '../lib/modules/vote.js';
import { algoliaDocumentExport } from './search/utils';

/*

Test if a user has voted on the server

*/
const hasVotedServer = async ({ document, voteType, user }) => {
  const vote = await Connectors.get(Votes, {
    documentId: document._id,
    userId: user._id, voteType,
    cancelled: false,
  }, {}, true);
  return vote;
}

/*

Add a vote of a specific type on the server

*/
const addVoteServer = async (voteOptions) => {

  const { document, collection, voteType, user, voteId, updateDocument } = voteOptions;
  const newDocument = _.clone(document);

  // create vote and insert it
  const vote = createVote({ document, collectionName: collection.options.collectionName, voteType, user, voteId });
  delete vote.__typename;
  await Connectors.create(Votes, vote);

  // LESSWRONG – recalculateBaseScore
  newDocument.baseScore = recalculateBaseScore(newDocument)
  newDocument.score = recalculateScore(newDocument);
  newDocument.voteCount++;

  if (updateDocument) {
    // update document score & set item as active
    await Connectors.update(collection,
      {_id: document._id},
      {
        $set: {
          inactive: false,
          baseScore: newDocument.baseScore,
          score: newDocument.score
        },
        $inc: { voteCount: 1 },
      },
      {}, true
    );
    algoliaDocumentExport({ documents: [newDocument], collection });
  }
  return {newDocument, vote};
}

/*

Clear all votes for a given document and user (server)

*/
const clearVotesServer = async ({ document, user, collection, updateDocument }) => {
  const newDocument = _.clone(document);
  const votes = await Connectors.find(Votes, {
    documentId: document._id,
    userId: user._id,
    cancelled: false,
  });
  if (votes.length) {
    // Cancel all the existing votes
    await Connectors.update(Votes,
      {documentId: document._id, userId: user._id},
      {$set: {cancelled: true}},
      {multi:true}, true);
    votes.forEach((vote) => {
      //eslint-disable-next-line no-unused-vars
      const {_id, ...otherVoteFields} = vote;
      // Create an un-vote for each of the existing votes
      const unvote = {
        ...otherVoteFields,
        cancelled: true,
        isUnvote: true,
        power: -vote.power,
        votedAt: new Date(),
      };
      Connectors.create(Votes, unvote);
      
      runCallbacks(`votes.cancel.sync`, {newDocument, vote}, collection, user);
      runCallbacksAsync(`votes.cancel.async`, {newDocument, vote}, collection, user);
    })
    if (updateDocument) {
      await Connectors.update(collection,
        {_id: document._id},
        {
          $set: {baseScore: recalculateBaseScore(document) },
          $inc: {voteCount: -votes.length},
        },
        {}, true
      );
    }
    newDocument.baseScore = recalculateBaseScore(newDocument);
    newDocument.score = recalculateScore(newDocument);
    newDocument.voteCount -= votes.length;
    algoliaDocumentExport({ documents: [newDocument], collection });
  }
  return newDocument;
}

/*

Cancel votes of a specific type on a given document (server)

*/
export const cancelVoteServer = async ({ document, voteType, collection, user, updateDocument }) => {

  const newDocument = _.clone(document);
  const vote = Votes.findOne({
    documentId: document._id,
    userId: user._id,
    voteType,
    cancelled: false,
  })
  
  //eslint-disable-next-line no-unused-vars
  const {_id, ...otherVoteFields} = vote;
  const unvote = {
    ...otherVoteFields,
    cancelled: true,
    isUnvote: true,
    power: -vote.power,
    votedAt: new Date(),
  };
  Connectors.create(Votes, unvote);
  
  // Set the cancelled field on the vote object to true
  await Connectors.update(Votes,
    {_id: vote._id},
    {$set: {cancelled: true}},
    {}, true);
  newDocument.baseScore = recalculateBaseScore(newDocument);
  newDocument.score = recalculateScore(newDocument);
  newDocument.voteCount--;

  if (updateDocument) {
    // update document score
    await Connectors.update(
      collection,
      {_id: document._id},
      {
        $set: {
          inactive: false,
          score: newDocument.score,
          baseScore: newDocument.baseScore
        },
        $inc: {
          voteCount: -1
        }
      },
      {},
      true
    );
    algoliaDocumentExport({ documents: [newDocument], collection });
  }
  return {newDocument, vote};
}
/*

Server-side database operation

### updateDocument
if set to true, this will perform its own database updates. If false, will only
return an updated document without performing any database operations on it.

*/
export const performVoteServer = async ({ documentId, document, voteType = 'bigUpvote', collection, voteId = Random.id(), user, updateDocument = true }) => {

  const collectionName = collection.options.collectionName;
  document = document || await Connectors.get(collection, documentId);

  debug('');
  debugGroup('--------------- start \x1b[35mperformVoteServer\x1b[0m  ---------------');
  debug('collectionName: ', collectionName);
  debug('document: ', document);
  debug('voteType: ', voteType);

  const voteOptions = {document, collection, voteType, user, voteId, updateDocument};

  if (!document || !user || !Users.canDo(user, `${collectionName.toLowerCase()}.${voteType}`)) {
    const VoteError = createError('voting.no_permission', {message: 'voting.no_permission'});
    throw new VoteError();
  }

  const existingVote = await hasVotedServer({document, voteType, user});

  if (existingVote) {

    // console.log('action: cancel')

    // runCallbacks(`votes.cancel.sync`, document, collection, user);
    let voteDocTuple = await cancelVoteServer(voteOptions);
    voteDocTuple = await runCallbacks(`votes.cancel.sync`, voteDocTuple, collection, user);
    document = voteDocTuple.newDocument;
    runCallbacksAsync(`votes.cancel.async`, voteDocTuple, collection, user);

  } else {

    // console.log('action: vote')

    if (voteTypes[voteType].exclusive) {
      document = await clearVotesServer(voteOptions)
    }

    let voteDocTuple = await addVoteServer({...voteOptions, document}); //Make sure to pass the new document to addVoteServer
    voteDocTuple = await runCallbacks(`votes.${voteType}.sync`, voteDocTuple, collection, user);
    document = voteDocTuple.newDocument;
    runCallbacksAsync(`votes.${voteType}.async`, voteDocTuple, collection, user);
  }

  debug('document after vote: ', document);
  debugGroupEnd();
  debug('--------------- end \x1b[35m performVoteServer\x1b[0m ---------------');
  debug('');

  // const newDocument = collection.findOne(documentId);
  document.__typename = collection.options.typeName;
  return document;

}