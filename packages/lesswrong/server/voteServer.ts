import { Connectors, runCallbacks, runCallbacksAsync, createMutator, updateMutator } from './vulcan-lib';
import Votes from '../lib/collections/votes/collection';
import Users from '../lib/collections/users/collection';
import { recalculateScore, recalculateBaseScore } from '../lib/scoring';
import { voteTypes, createVote } from '../lib/voting/vote';
import { algoliaExportById } from './search/utils';
import moment from 'moment';
import { Random } from 'meteor/random';
import * as _ from 'underscore';


// Test if a user has voted on the server
const hasVotedServer = async ({ document, voteType, user }: {
  document: any,
  voteType: string,
  user: DbUser,
}) => {
  const vote = await Connectors.get(Votes, {
    documentId: document._id,
    userId: user._id, voteType,
    cancelled: false,
  }, {}, true);
  return vote;
}

// Add a vote of a specific type on the server
const addVoteServer = async ({ document, collection, voteType, user, voteId, updateDocument }: {
  document: any,
  collection: any,
  voteType: string,
  user: DbUser,
  voteId: string,
  updateDocument: boolean
}) => {
  const newDocument = _.clone(document);

  // create vote and insert it
  const vote = createVote({ document, collectionName: collection.options.collectionName, voteType, user, voteId });
  delete vote.__typename;
  await createMutator({
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
    void algoliaExportById(collection, newDocument._id);
  }
  return {newDocument, vote};
}

// Clear all votes for a given document and user (server)
const clearVotesServer = async ({ document, user, collection, updateDocument }: {
  document: any,
  user: DbUser,
  collection: any,
  updateDocument: boolean,
}) => {
  const newDocument = _.clone(document);
  const votes = await Connectors.find(Votes, {
    documentId: document._id,
    userId: user._id,
    cancelled: false,
  });
  if (votes.length) {
    for (let vote of votes) {
      // Cancel the existing votes
      await updateMutator({
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
      await createMutator({
        collection: Votes,
        document: unvote,
        validate: false,
      });

      runCallbacks({
        name: `votes.cancel.sync`,
        iterator: {newDocument, vote},
        properties: [collection, user]
      });
      runCallbacksAsync({
        name: `votes.cancel.async`,
        properties: [{newDocument, vote}, collection, user]
      });
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
    void algoliaExportById(collection, newDocument._id);
  }
  return newDocument;
}

// Cancel votes of a specific type on a given document (server)
export const cancelVoteServer = async ({ document, voteType, collection, user, updateDocument }: {
  document: any,
  voteType: string,
  collection: any,
  user: DbUser,
  updateDocument: boolean
}) => {
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
  await createMutator({
    collection: Votes,
    document: unvote,
    validate: false,
  });

  // Set the cancelled field on the vote object to true
  await updateMutator({
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
    void algoliaExportById(collection, newDocument._id);
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
  user: DbUser,
  updateDocument?: boolean,
  toggleIfAlreadyVoted?: boolean,
}) => {
  const collectionName = collection.options.collectionName;
  document = document || await Connectors.get(collection, documentId);

  const voteOptions = {document, collection, voteType, user, voteId, updateDocument};

  const collectionVoteType = `${collectionName.toLowerCase()}.${voteType}`

  if (!document) throw new Error("Error casting vote: Document not found.");
  if (!user) throw new Error("Error casting vote: Not logged in.");
  if (!Users.canDo(user, collectionVoteType)) {
    throw new Error(`Error casting vote: User can't cast votes of type ${collectionVoteType}.`);
  }
  if (!voteTypes[voteType]) throw new Error("Invalid vote type");

  const existingVote = await hasVotedServer({document, voteType, user});

  if (existingVote) {
    if (toggleIfAlreadyVoted) {
      let voteDocTuple = await cancelVoteServer(voteOptions);
      voteDocTuple = await runCallbacks({
        name: `votes.cancel.sync`,
        iterator: voteDocTuple,
        properties: [collection, user]
      });
      document = voteDocTuple.newDocument;
      runCallbacksAsync({
        name: `votes.cancel.async`,
        properties: [voteDocTuple, collection, user]
      });
    }
  } else {
    await checkRateLimit({ document, collection, voteType, user });

    if (voteTypes[voteType]?.exclusive) {
      document = await clearVotesServer(voteOptions)
    }

    let voteDocTuple = await addVoteServer({...voteOptions, document}); //Make sure to pass the new document to addVoteServer
    voteDocTuple = await runCallbacks({
      name: `votes.${voteType}.sync`,
      iterator: voteDocTuple,
      properties: [collection, user]
    });
    document = voteDocTuple.newDocument;
    runCallbacksAsync({
      name: `votes.${voteType}.async`,
      properties: [voteDocTuple, collection, user]
    });
  }

  document.__typename = collection.options.typeName;
  return document;
}

const getVotingRateLimits = async (user: DbUser|null) => {
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
const checkRateLimit = async ({ document, collection, voteType, user }: {
  document: any,
  collection: any,
  voteType: string,
  user: DbUser
}): Promise<void> => {
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
