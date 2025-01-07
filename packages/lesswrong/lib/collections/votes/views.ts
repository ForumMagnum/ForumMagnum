import { Votes } from './collection';
import { ensureIndex } from '../../collectionIndexUtils';
import moment from 'moment';

declare global {
  interface VotesViewTerms extends ViewTermsBase {
    view?: VotesViewName,
    voteType?: string,
    collectionName?: CollectionNameString,
    collectionNames?: CollectionNameString[],
    after?: string,
    before?: string
  }
}

ensureIndex(Votes, {cancelled:1, userId:1, documentId:1});
ensureIndex(Votes, {cancelled:1, documentId:1});
ensureIndex(Votes, {cancelled:1, userId:1, votedAt:-1});

// Used by getKarmaChanges
ensureIndex(Votes, {authorIds: 1});

// Used by getUsersTopUpvotedUsers - the index that put `cancelled` first was not very helpful for this since it was doing a full index scan
ensureIndex(Votes, { userId: 1, cancelled: 1, votedAt: 1 });

Votes.addView("tagVotes", function () {
  return {
    selector: {
      collectionName: "TagRels",
      cancelled: false,
    },
    options: {
      sort: {
        votedAt: -1
      }
    }
  }
})
ensureIndex(Votes, {collectionName: 1, votedAt: 1})

Votes.addView("userPostVotes", function ({voteType, collectionName, after, before}, _, context?: ResolverContext) {
  const votedAtFilter = []
  if (after) {
    votedAtFilter.push({votedAt: {$gte: moment(after).toDate()}})
  }
  if (before) {
    votedAtFilter.push({votedAt: {$lt: moment(before).toDate()}})
  }
  
  return {
    selector: {
      collectionName: collectionName,
      userId: context?.currentUser?._id,
      voteType: voteType,
      cancelled: false,
      isUnvote: false,
      $and: votedAtFilter,
    },
    options: {
      sort: {
        votedAt: -1
      }
    }
  }
})
ensureIndex(Votes, {collectionName: 1, userId: 1, voteType: 1, cancelled: 1, isUnvote: 1, votedAt: 1})

Votes.addView("userVotes", function ({collectionNames,}, _, context?: ResolverContext) {
  const currentUserId = context?.currentUser?._id;
  return {
    selector: {
      collectionName: {$in: collectionNames},
      userId: currentUserId,
      ...(currentUserId ? {authorIds: {$not: currentUserId}} : {}),
      cancelled: {$ne: true},
      isUnvote: {$ne: true},
      // only include neutral votes that have extended vote data
      $or: {
        voteType: {$ne: "neutral"},
        extendedVoteType: {$exists: true},
      },
    },
    options: {
      sort: {
        votedAt: -1
      }
    }
  }
})
