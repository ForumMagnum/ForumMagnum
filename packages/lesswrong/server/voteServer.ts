import { Connectors } from './vulcan-lib/connectors';
import { createMutator, updateMutator } from './vulcan-lib/mutators';
import Votes from '../lib/collections/votes/collection';
import { userCanDo } from '../lib/vulcan-users/permissions';
import {recalculateScore, recalculateBaseScore, recalculateVoteCount, recalculateBaseScoresRecord, recalculateVoteCountsRecord} from '../lib/scoring';
import {voteTypes, VoteTypesRecordType, PowersRecordType} from '../lib/voting/voteTypes';
import { createVote, voteCallbacks, VoteDocTuple } from '../lib/voting/vote';
import { algoliaExportById } from './search/utils';
import moment from 'moment';
import { randomId } from '../lib/random';
import * as _ from 'underscore';


// Test whether the user has voted (any vote on any dimension) on this document
const hasVotedServer = async ({ document, user }: {
  document: DbVoteableType,
  user: DbUser,
}) => {
  const vote = await Connectors.get(Votes, {
    documentId: document._id,
    userId: user._id,
    cancelled: false,
  }, {}, true);
  return vote;
}

// Test whether the user has already made an Overall vote of this voteType on this document
// This is used in performVoteServerShim to check whether to transform an old-style/GreaterWrong
// toggle-off vote into a null voteType
const hasSameOverallVoteServer = async ({ document, voteType, user }: {
  document: DbVoteableType,
  voteType: string,
  user: DbUser,
}) => {
  const vote = await Connectors.get(Votes, {
    documentId: document._id,
    userId: user._id,
    voteType,
    cancelled: false,
  }, {}, true);
  return vote;
}

// Clear all votes for a given document and user (server)
export const clearVotesServer = async ({ document, user, collection }: {
  document: DbVoteableType,
  user: DbUser,
  collection: CollectionBase<DbVoteableType>
}) => {
  const newDocument = _.clone(document);
  const userVotes = await Connectors.find(Votes, {
    documentId: document._id,
    userId: user._id,
    cancelled: false,
  });
  if (userVotes.length) {
    for (let vote of userVotes) {
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
      
      const powersRecord:PowersRecordType = (() => {
        if (!!vote.voteTypesRecord) {
          return _.mapObject(vote.powersRecord, function(val, _) {
            return val * -1
          })
        } else {
          return { "Overall": -vote.power }
        }
      })()

      const unvote = {
        ...otherVoteFields,
        cancelled: true,
        isUnvote: true,
        power: -vote.power,
        afPower: -vote.afPower,
        powersRecord,
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

    const votes = await Votes.find(
      {
        documentId: document._id,
        cancelled: false
      }
    ).fetch() || [];

    newDocument.baseScore = await recalculateBaseScore(newDocument, votes);
    newDocument.score = recalculateScore(newDocument);
    newDocument.voteCount = await recalculateVoteCount(newDocument, votes);
    newDocument.voteCountsRecord = await recalculateVoteCountsRecord(newDocument, votes)
    newDocument.baseScoresRecord = await recalculateBaseScoresRecord(newDocument, votes)
    await Connectors.update(collection,
      {_id: document._id},
      {
        $set: {
          baseScore: newDocument.baseScore,
          score: newDocument.score,
          voteCount: newDocument.voteCount,
          voteCountsRecord: newDocument.voteCountsRecord,
          baseScoresRecord: newDocument.baseScoresRecord
        },
      },
      {}, true
    );
    void algoliaExportById(collection as any, newDocument._id);
  }
  return newDocument;
}

// Add a vote of a specific type on the server
const addVoteServer = async ({ document, collection, voteType, voteTypesRecord, user, voteId }: {
  document: DbVoteableType,
  collection: CollectionBase<DbVoteableType>,
  voteType: string|null,
  voteTypesRecord: VoteTypesRecordType,
  user: DbUser,
  voteId: string,
}): Promise<VoteDocTuple> => {
  const newDocument = _.clone(document);

  // create vote and insert it
  const partialVote = createVote({ document, collectionName: collection.options.collectionName, voteType, voteTypesRecord, user, voteId });
  const {data: vote} = await createMutator({
    collection: Votes,
    document: partialVote,
    validate: false,
  });

  const votes = await Votes.find(
    {
      documentId: document._id,
      cancelled: false
    }
  ).fetch() || [];

  // LESSWRONG – recalculateBaseScore
  newDocument.baseScore = await recalculateBaseScore(newDocument, votes)
  newDocument.score = recalculateScore(newDocument);
  newDocument.voteCount = await recalculateVoteCount(newDocument, votes);
  newDocument.voteCountsRecord = await recalculateVoteCountsRecord(newDocument, votes)
  newDocument.baseScoresRecord = await recalculateBaseScoresRecord(newDocument, votes)

  // update document score & set item as active
  await Connectors.update(collection,
    {_id: document._id},
    {
      $set: {
        inactive: false,
        baseScore: newDocument.baseScore,
        score: newDocument.score,
        baseScoresRecord: newDocument.baseScoresRecord,
        voteCount: newDocument.voteCount,
        voteCountsRecord: newDocument.voteCountsRecord
      },
    },
    {}, true
  );

  console.log('saved', {baseScoresRecord: newDocument.baseScoresRecord}, {baseScore: newDocument.baseScore})

  void algoliaExportById(collection as any, newDocument._id);
  return {newDocument, vote};
}

// GreaterWrong still sends old-style toggle votes, i.e. votes that are Overall-only,
// and if they're the same voteType as already exists on the server, are intended
// to undo that vote. GreaterWrong vote mutations call performVoteServerShim, which
// transform these old-style votes into new-style ones, where the new votes replace
// old votes rather than toggling them on and off.
export const performVoteServerShim = async ({ documentId, voteType, collection, user }: {
  documentId: string,
  voteType: string,
  collection: CollectionBase<DbVoteableType>,
  user: DbUser
}) => {
  const document = await Connectors.get(collection, documentId);
  if (!document) throw new Error("Error casting vote: Document not found.");

  const existingSameOverallVote = await hasSameOverallVoteServer({document, voteType, user});
  if (existingSameOverallVote) {
    const voteTypesRecord = { ...existingSameOverallVote.voteTypesRecord, "Overall": null }
    await performVoteServer({document, voteType, voteTypesRecord, collection, user})
  } else {
    const voteTypesRecord = { "Overall": voteType }
    await performVoteServer({document, voteType, voteTypesRecord, collection, user})
  }
}

// Server-side database operation
export const performVoteServer = async ({ documentId, document, voteType, voteTypesRecord, collection, voteId = randomId(), user }: {
  documentId?: string,
  document?: DbVoteableType|null,
  voteType: string|null,
  voteTypesRecord: VoteTypesRecordType,
  collection: CollectionBase<DbVoteableType>,
  voteId?: string,
  user: DbUser
}) => {
  const collectionName = collection.options.collectionName;
  document = document || await Connectors.get(collection, documentId);

  if (!document) throw new Error("Error casting vote: Document not found.");

  const voteOptions = {document, collection, voteType, voteTypesRecord, user, voteId };

  const collectionVoteType = `${collectionName.toLowerCase()}.${voteType}`

  if (!user) throw new Error("Error casting vote: Not logged in.");
  if (!userCanDo(user, collectionVoteType)) {
    throw new Error(`Error casting vote: User can't cast votes of type ${collectionVoteType}.`);
  }

  if (typeof voteType === "string" && !voteTypes[voteType]) throw new Error("Invalid vote type");

  if (collectionName==="Revisions" && (document as DbRevision).collectionName!=='Tags')
    throw new Error("Revisions are only voteable if they're revisions of tags");
  
  const existingVote = await hasVotedServer({document, user});

  // If there's an existing vote, don't check the rate limit; clear it and re-add the ballot
  if (existingVote) {
    document = await clearVotesServer(voteOptions)
  } else {
    await checkRateLimit({ document, user }); // throws an error if rate limit exceeded
  }

  // If this was an undo vote and there are no other existing votes on the ballot, we're done
  if (Object.values(voteTypesRecord).every(x => x === null)) return document;

  document = document || await Connectors.get(collection, documentId);

  let voteDocTuple: VoteDocTuple = await addVoteServer({...voteOptions, document}); //Make sure to pass the new document to addVoteServer
  
  voteDocTuple = await voteCallbacks.castVoteSync.runCallbacks({
    iterator: voteDocTuple,
    properties: [collection, user]
  });
  document = voteDocTuple.newDocument;
  void voteCallbacks.castVoteAsync.runCallbacksAsync(
    [voteDocTuple, collection, user]
  );

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
const checkRateLimit = async ({ document, user }: {
  document: DbVoteableType,
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
