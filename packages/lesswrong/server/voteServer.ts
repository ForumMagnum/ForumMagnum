import { Connectors } from './vulcan-lib/connectors';
import { createMutator, updateMutator } from './vulcan-lib/mutators';
import Votes from '../lib/collections/votes/collection';
import { userCanDo } from '../lib/vulcan-users/permissions';
import { recalculateScore, recalculateBaseScore } from '../lib/scoring';
import { voteTypes } from '../lib/voting/voteTypes';
import { createVote, voteCallbacks, VoteDocTuple } from '../lib/voting/vote';
import { algoliaExportById } from './search/utils';
import moment from 'moment';
import { randomId } from '../lib/random';
import * as _ from 'underscore';


// Test if a user has voted on the server
const hasVotedServer = async ({ document, voteType, user }: {
  document: DbVoteableType,
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
const addVoteServer = async ({ document, collection, voteType, user, voteId }: {
  document: DbVoteableType,
  collection: CollectionBase<DbVoteableType>,
  voteType: string,
  user: DbUser,
  voteId: string,
}): Promise<VoteDocTuple> => {
  const newDocument = _.clone(document);

  // create vote and insert it
  const partialVote = createVote({ document, collectionName: collection.options.collectionName, voteType, user, voteId });
  delete partialVote.__typename;
  const {data: vote} = await createMutator({
    collection: Votes,
    document: partialVote,
    validate: false,
  });

  // LESSWRONG – recalculateBaseScore
  newDocument.baseScore = recalculateBaseScore(newDocument)
  newDocument.score = recalculateScore(newDocument);
  newDocument.voteCount++;

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
  void algoliaExportById(collection as any, newDocument._id);
  return {newDocument, vote};
}

// Clear all votes for a given document and user (server)
export const clearVotesServer = async ({ document, user, collection }: {
  document: DbVoteableType,
  user: DbUser,
  collection: CollectionBase<DbVoteableType>
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

      await voteCallbacks.cancelSync.runCallbacks({
        iterator: {newDocument, vote},
        properties: [collection, user]
      });
      await voteCallbacks.cancelAsync.runCallbacksAsync(
        [{newDocument, vote}, collection, user]
      );
    }
    await Connectors.update(collection,
      {_id: document._id},
      {
        $set: {baseScore: recalculateBaseScore(document) },
      },
      {}, true
    );
    newDocument.baseScore = recalculateBaseScore(newDocument);
    newDocument.score = recalculateScore(newDocument);
    newDocument.voteCount -= votes.length;
    void algoliaExportById(collection as any, newDocument._id);
  }
  return newDocument;
}

// Server-side database operation
export const performVoteServer = async ({ documentId, document, voteType = 'bigUpvote', collection, voteId = randomId(), user, toggleIfAlreadyVoted = true }: {
  documentId?: string,
  document?: DbVoteableType|null,
  voteType: string,
  collection: CollectionBase<DbVoteableType>,
  voteId?: string,
  user: DbUser,
  toggleIfAlreadyVoted?: boolean,
}) => {
  const collectionName = collection.options.collectionName;
  document = document || await Connectors.get(collection, documentId);

  if (!document) throw new Error("Error casting vote: Document not found.");
  
  const voteOptions = {document, collection, voteType, user, voteId };

  const collectionVoteType = `${collectionName.toLowerCase()}.${voteType}`

  if (!user) throw new Error("Error casting vote: Not logged in.");
  if (!userCanDo(user, collectionVoteType)) {
    throw new Error(`Error casting vote: User can't cast votes of type ${collectionVoteType}.`);
  }
  if (!voteTypes[voteType]) throw new Error("Invalid vote type");

  const existingVote = await hasVotedServer({document, voteType, user});

  if (existingVote) {
    if (toggleIfAlreadyVoted) {
      document = await clearVotesServer(voteOptions)
    }
  } else {
    await checkRateLimit({ document, collection, voteType, user });

    document = await clearVotesServer(voteOptions)

    let voteDocTuple: VoteDocTuple = await addVoteServer({...voteOptions, document}); //Make sure to pass the new document to addVoteServer
    voteDocTuple = await voteCallbacks.castVoteSync.runCallbacks({
      iterator: voteDocTuple,
      properties: [collection, user]
    });
    document = voteDocTuple.newDocument;
    void voteCallbacks.castVoteAsync.runCallbacksAsync(
      [voteDocTuple, collection, user]
    );
  }

  (document as any).__typename = collection.options.typeName;
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
  document: DbVoteableType,
  collection: CollectionBase<DbVoteableType>,
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
