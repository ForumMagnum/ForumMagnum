import { Connectors } from './vulcan-lib/connectors';
import { createMutator, updateMutator } from './vulcan-lib/mutators';
import Votes from '../lib/collections/votes/collection';
import { userCanDo } from '../lib/vulcan-users/permissions';
import { recalculateScore } from '../lib/scoring';
import { voteTypes } from '../lib/voting/voteTypes';
import { voteCallbacks, VoteDocTuple, getVotePower } from '../lib/voting/vote';
import { getVotingSystemForDocument, VotingSystem } from '../lib/voting/votingSystems';
import { algoliaExportById } from './search/utils';
import { createAnonymousContext } from './vulcan-lib/query';
import moment from 'moment';
import { randomId } from '../lib/random';
import * as _ from 'underscore';
import sumBy from 'lodash/sumBy'
import uniq from 'lodash/uniq';
import keyBy from 'lodash/keyBy';
import { getConfirmedCoauthorIds } from '../lib/collections/posts/helpers';

// Test if a user has voted on the server
const getExistingVote = async ({ document, user }: {
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

// Add a vote of a specific type on the server
const addVoteServer = async ({ document, collection, voteType, extendedVote, user, voteId, context }: {
  document: DbVoteableType,
  collection: CollectionBase<DbVoteableType>,
  voteType: string,
  extendedVote: any,
  user: DbUser,
  voteId: string,
  context: ResolverContext,
}): Promise<VoteDocTuple> => {
  // create vote and insert it
  const partialVote = createVote({ document, collectionName: collection.options.collectionName, voteType, extendedVote, user, voteId });
  const {data: vote} = await createMutator({
    collection: Votes,
    document: partialVote,
    validate: false,
  });

  let newDocument = {
    ...document,
    ...(await recalculateDocumentScores(document, context)),
  }
  
  // update document score & set item as active
  await collection.rawUpdateOne(
    {_id: document._id},
    {
      $set: {
        inactive: false,
        baseScore: newDocument.baseScore,
        score: newDocument.score,
        extendedScore: newDocument.extendedScore,
      },
    },
    {}
  );
  void algoliaExportById(collection as any, newDocument._id);
  return {newDocument, vote};
}

// Create new vote object
export const createVote = ({ document, collectionName, voteType, extendedVote, user, voteId }: {
  document: VoteableType,
  collectionName: CollectionNameString,
  voteType: string,
  extendedVote: any,
  user: DbUser|UsersCurrent,
  voteId?: string,
}): Partial<DbVote> => {
  if (!document.userId)
    throw new Error("Voted-on document does not have an author userId?");

  const coauthors = collectionName === "Posts"
    ? getConfirmedCoauthorIds(document as DbPost)
    : [];

  return {
    // when creating a vote from the server, voteId can sometimes be undefined
    ...(voteId ? {_id:voteId} : undefined),
    
    documentId: document._id,
    collectionName,
    userId: user._id,
    voteType: voteType,
    extendedVoteType: extendedVote,
    power: getVotePower({user, voteType, document}),
    votedAt: new Date(),
    authorIds: [document.userId, ...coauthors],
    cancelled: false,
    documentIsAf: !!(document.af),
  }
};

// Clear all votes for a given document and user (server)
export const clearVotesServer = async ({ document, user, collection, excludeLatest, context }: {
  document: DbVoteableType,
  user: DbUser,
  collection: CollectionBase<DbVoteableType>,
  // If true, clears all votes except the latest (ie, only clears duplicate
  // votes). If false, clears all votes (including the latest).
  excludeLatest?: boolean,
  context: ResolverContext,
}) => {
  let newDocument = _.clone(document);
  const votes = await Connectors.find(Votes, {
    documentId: document._id,
    userId: user._id,
    cancelled: false,
  });
  if (votes.length) {
    const latestVoteId = _.max(votes, v=>v.votedAt)?._id;
    for (let vote of votes) {
      if (excludeLatest && vote._id === latestVoteId) {
        continue;
      }
      
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
    const newScores = await recalculateDocumentScores(document, context);
    await collection.rawUpdateOne(
      {_id: document._id},
      {
        $set: {...newScores },
      },
      {}
    );
    newDocument = {
      ...newDocument,
      ...newScores,
    };
    void algoliaExportById(collection as any, newDocument._id);
  }
  return newDocument;
}

// Server-side database operation
export const performVoteServer = async ({ documentId, document, voteType, extendedVote, collection, voteId = randomId(), user, toggleIfAlreadyVoted = true, context }: {
  documentId?: string,
  document?: DbVoteableType|null,
  voteType: string,
  extendedVote?: any,
  collection: CollectionBase<DbVoteableType>,
  voteId?: string,
  user: DbUser,
  toggleIfAlreadyVoted?: boolean,
  context?: ResolverContext,
}) => {
  if (!context)
    context = await createAnonymousContext();

  const collectionName = collection.options.collectionName;
  document = document || await Connectors.get(collection, documentId);

  if (!document) throw new Error("Error casting vote: Document not found.");
  
  const collectionVoteType = `${collectionName.toLowerCase()}.${voteType}`

  if (!user) throw new Error("Error casting vote: Not logged in.");
  if (!extendedVote && voteType && voteType !== "neutral" && !userCanDo(user, collectionVoteType)) {
    throw new Error(`Error casting vote: User can't cast votes of type ${collectionVoteType}.`);
  }
  if (!voteTypes[voteType]) throw new Error(`Invalid vote type in performVoteServer: ${voteType}`);

  if (collectionName==="Revisions" && (document as DbRevision).collectionName!=='Tags')
    throw new Error("Revisions are only voteable if they're revisions of tags");
  
  const existingVote = await getExistingVote({document, user});

  if (existingVote && existingVote.voteType === voteType && !extendedVote) {
    if (toggleIfAlreadyVoted) {
      document = await clearVotesServer({document, user, collection, context})
    }
  } else {
    await checkRateLimit({ document, collection, voteType, user });

    let voteDocTuple: VoteDocTuple = await addVoteServer({document, user, collection, voteType, extendedVote, voteId, context});
    voteDocTuple = await voteCallbacks.castVoteSync.runCallbacks({
      iterator: voteDocTuple,
      properties: [collection, user]
    });
    document = voteDocTuple.newDocument;
    
    document = await clearVotesServer({
      document, user, collection,
      excludeLatest: true,
      context
    })
    
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
    perDay: 200,
    perHour: 100,
    perUserPerDay: 100,
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
    authorIds: {$ne: user._id}, // Self-votes don't count
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

  const votesOnThisAuthor = _.filter(votesInLastDay, vote=>vote.authorIds.includes(document.userId));
  if (votesOnThisAuthor.length >= rateLimits.perUserPerDay) {
    throw new Error("Voting rate limit exceeded: too many votes today on content by this author");
  }
}

function voteHasAnyEffect(votingSystem: VotingSystem, vote: DbVote, af: boolean) {
  if (votingSystem.name !== "default") {
    // If using a non-default voting system, include neutral votes in the vote
    // count, because they may have an effect that's not captured in their power.
    return true;
  }
  
  if (af) {
    return !!vote.afPower;
  } else {
    return !!vote.power;
  }
}

export const recalculateDocumentScores = async (document: VoteableType, context: ResolverContext) => {
  const votes = await Votes.find(
    {
      documentId: document._id,
      cancelled: false
    }
  ).fetch() || [];
  
  const userIdsThatVoted = uniq(votes.map(v=>v.userId));
  // make sure that votes associated with users that no longer exist get ignored for the AF score
  const usersThatVoted = (await context.loaders.Users.loadMany(userIdsThatVoted))?.filter(u=>!!u);
  const usersThatVotedById = keyBy(usersThatVoted, u=>u._id);
  
  const afVotes = _.filter(votes, v=>userCanDo(usersThatVotedById[v.userId], "votes.alignment"));

  const votingSystem = await getVotingSystemForDocument(document, context);
  const nonblankVoteCount = votes.filter(v => (!!v.voteType && v.voteType !== "neutral") || votingSystem.isNonblankExtendedVote(v)).length;
  
  const baseScore = sumBy(votes, v=>v.power)
  const afBaseScore = sumBy(afVotes, v=>v.afPower)
  
  const voteCount = _.filter(votes, v=>voteHasAnyEffect(votingSystem, v, false)).length;
  const afVoteCount = _.filter(afVotes, v=>voteHasAnyEffect(votingSystem, v, true)).length;
  
  return {
    baseScore, afBaseScore,
    voteCount: voteCount,
    afVoteCount: afVoteCount,
    extendedScore: await votingSystem.computeExtendedScore(votes, context),
    afExtendedScore: await votingSystem.computeExtendedScore(afVotes, context),
    score: recalculateScore({...document, baseScore})
  };
}
