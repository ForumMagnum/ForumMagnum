import { Votes } from './collection';
import { ensureIndex } from '../../collectionUtils';
import moment from 'moment';

declare global {
  interface VotesViewTerms extends ViewTermsBase {
    view?: VotesViewName,
    userId?: string,
    voteType?: string,
    collectionName?: string,
    after?: string,
    before?: string
  }
}

ensureIndex(Votes, {cancelled:1, userId:1, documentId:1});
ensureIndex(Votes, {cancelled:1, documentId:1});
ensureIndex(Votes, {cancelled:1, userId:1, votedAt:-1});

// Used by getKarmaChanges
ensureIndex(Votes, {authorId:1, votedAt:1, userId:1, afPower:1});


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

Votes.addView("userPostVotes", function ({userId, voteType, collectionName, after, before}) {
  return {
    selector: {
      collectionName: collectionName,
      userId: userId,
      voteType: voteType,
      cancelled: false,
      $and: [{votedAt: {$gte: moment(after).toDate()}}, {votedAt: {$lt: moment(before).toDate()}}],
    },
    options: {
      sort: {
        votedAt: -1
      }
    }
  }
})
