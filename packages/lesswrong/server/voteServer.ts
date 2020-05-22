import { debug, debugGroup, debugGroupEnd, Connectors, runCallbacks, runCallbacksAsync, newMutation, editMutation } from './vulcan-lib';
import Votes from '../lib/collections/votes/collection';
import Users from '../lib/collections/users/collection';
import { recalculateScore, recalculateBaseScore } from '../lib/scoring';
import { voteTypes, createVote } from '../lib/voting/vote';
import { algoliaDocumentExport } from './search/utils';
import moment from 'moment';
import { Random } from 'meteor/random';
import * as _ from 'underscore';


// Test if a user has voted on the server
const hasVotedServer = async ({ document, voteType, user }) => {
  const vote = await Connectors.get(Votes, {
    documentId: document._id,
    userId: user._id, voteType,
    cancelled: false,
  }, {}, true);
  return vote;
}

// Add a vote of a specific type on the server
const addVoteServer = async (voteOptions) => {

  const { document, collection, voteType, user, voteId, updateDocument } = voteOptions;
  const newDocument = _.clone(document);

  // create vote and insert it
  const vote = createVote({ document, collectionName: collection.options.collectionName, voteType, user, voteId });
  delete vote.__typename;
  await newMutation({
    collection: Votes,
    document: vote,
    validate: false,
  });

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
      },
      {}, true
    );
    algoliaDocumentExport({ documents: [newDocument], collection });
  }
  return {newDocument, vote};
}

// Clear all votes for a given document and user (server)
const clearVotesServer = async ({ document, user, collection, updateDocument }) => {
  const newDocument = _.clone(document);
  const votes = await Connectors.find(Votes, {
    documentId: document._id,
    userId: user._id,
    cancelled: false,
  });
  if (votes.length) {
    for (let vote of votes) {
      // Cancel the existing votes
      await editMutation({
        collection: Votes,
        documentId: vote._id,
        set: { cancelled: true },
        unset: {},
        validate: false,
      });

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
      await newMutation({
        collection: Votes,
        document: unvote,
        validate: false,
      });

      runCallbacks(`votes.cancel.sync`, {newDocument, vote}, collection, user);
      runCallbacksAsync(`votes.cancel.async`, {newDocument, vote}, collection, user);
    }
    if (updateDocument) {
      await Connectors.update(collection,
        {_id: document._id},
        {
          $set: {baseScore: recalculateBaseScore(document) },
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

// Cancel votes of a specific type on a given document (server)
export const cancelVoteServer = async ({ document, voteType, collection, user, updateDocument }) => {

  const newDocument = _.clone(document);
  const vote = Votes.findOne({
    documentId: document._id,
    userId: user._id,
    voteType,
    cancelled: false,
  })

  if (!vote) throw Error(`Can't find vote to cancel: ${document._id}, ${user._id}, ${voteType}`)

  //eslint-disable-next-line no-unused-vars
  const {_id, ...otherVoteFields} = vote;
  const unvote = {
    ...otherVoteFields,
    cancelled: true,
    isUnvote: true,
    power: -vote.power,
    votedAt: new Date(),
  };
  await newMutation({
    collection: Votes,
    document: unvote,
    validate: false,
  });

  // Set the cancelled field on the vote object to true
  await editMutation({
    collection: Votes,
    documentId: vote._id,
    set: { cancelled: true },
    unset: {},
    validate: false,
  });
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
      },
      {},
      true
    );
    algoliaDocumentExport({ documents: [newDocument], collection });
  }
  return {newDocument, vote};
}

// Server-side database operation
//
// ### updateDocument
// if set to true, this will perform its own database updates. If false, will only
// return an updated document without performing any database operations on it.
export const performVoteServer = async ({ documentId, document, voteType = 'bigUpvote', collection, voteId = Random.id(), user, updateDocument = true, toggleIfAlreadyVoted = true }: {
  documentId?: string,
  document?: any,
  voteType: string,
  collection: any,
  voteId?: string,
  user: any,
  updateDocument?: boolean,
  toggleIfAlreadyVoted?: boolean,
}) => {

  const collectionName = collection.options.collectionName;
  document = document || await Connectors.get(collection, documentId);

  debug('');
  debugGroup('--------------- start \x1b[35mperformVoteServer\x1b[0m  ---------------');
  debug('collectionName: ', collectionName);
  debug('document: ', document);
  debug('voteType: ', voteType);

  const voteOptions = {document, collection, voteType, user, voteId, updateDocument};

  const collectionVoteType = `${collectionName.toLowerCase()}.${voteType}`

  if (!document) throw new Error("Error casting vote: Document not found.");
  if (!user) throw new Error("Error casting vote: Not logged in.");
  if (!Users.canDo(user, collectionVoteType)) {
    throw new Error(`Error casting vote: User can't cast votes of type ${collectionVoteType}.`);
  }

  const existingVote = await hasVotedServer({document, voteType, user});

  if (existingVote) {

    if (toggleIfAlreadyVoted) {
      // console.log('action: cancel')
  
      // runCallbacks(`votes.cancel.sync`, document, collection, user);
      let voteDocTuple = await cancelVoteServer(voteOptions);
      voteDocTuple = await runCallbacks(`votes.cancel.sync`, voteDocTuple, collection, user);
      document = voteDocTuple.newDocument;
      runCallbacksAsync(`votes.cancel.async`, voteDocTuple, collection, user);
    }

  } else {

    await checkRateLimit({ document, collection, voteType, user });

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

const getVotingRateLimits = async (user) => {
  if (user?.isAdmin) {
    // Very lax rate limiting for admins
    return {
      perDay: 100000,
      perHour: 50000,
      perUserPerDay: 50000
    }
  }
  return {
    perDay: 100,
    perHour: 30,
    perUserPerDay: 30,
  };
}

// Check whether a given vote would exceed voting rate limits, and if so, throw
// an error. Otherwise do nothing.
const checkRateLimit = async ({ document, collection, voteType, user }):Promise<void> => {
  // No rate limit on self-votes
  if(document.userId === user._id)
    return;
  
  const rateLimits = await getVotingRateLimits(user);

  // Retrieve all non-cancelled votes cast by this user in the past 24 hours
  const oneDayAgo = moment().subtract(1, 'days').toDate();
  const votesInLastDay = await Votes.find({
    userId: user._id,
    authorId: {$ne: user._id}, // Self-votes don't count
    votedAt: {$gt: oneDayAgo},
    cancelled:false
  }).fetch();

  if (votesInLastDay.length >= rateLimits.perDay) {
    throw new Error("Voting rate limit exceeded: too many votes in one day");
  }

  const oneHourAgo = moment().subtract(1, 'hours').toDate();
  const votesInLastHour = _.filter(votesInLastDay, vote=>vote.votedAt >= oneHourAgo);

  if (votesInLastHour.length >= rateLimits.perHour) {
    throw new Error("Voting rate limit exceeded: too many votes in one hour");
  }

  const votesOnThisAuthor = _.filter(votesInLastDay, vote=>vote.authorId===document.userId);
  if (votesOnThisAuthor.length >= rateLimits.perUserPerDay) {
    throw new Error("Voting rate limit exceeded: too many votes today on content by this author");
  }
}
