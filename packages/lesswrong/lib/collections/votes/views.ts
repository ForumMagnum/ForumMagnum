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
ensureIndex(Votes, {authorIds:1, votedAt:1, userId:1, afPower:1});


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

Votes.addView("userPostVotes", function ({voteType, collectionName, after/* , before */}, _, context?: ResolverContext) {
  return {
    selector: {
      collectionName: collectionName,
      userId: context?.currentUser?._id,
      voteType: voteType,
      cancelled: false,
      isUnvote: false,
      // $and: [{votedAt: {$gte: moment(after).toDate()}}, {votedAt: {$lt: moment(before).toDate()}}],
      ...(after ? {votedAt: {$gte: moment(after).toDate()}} : {}),
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
  return {
    selector: {
      collectionName: {$in: collectionNames},
      userId: context?.currentUser?._id,
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
ensureIndex(Votes, {collectionName: 1, userId: 1, cancelled: 1, isUnvote: 1, voteType: 1, extendedVoteType: 1, votedAt: 1})
