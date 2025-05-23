import { CollectionViewSet } from '../../../lib/views/collectionViewSet';
import moment from 'moment';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

declare global {
  interface VotesViewTerms extends ViewTermsBase {
    view: VotesViewName | undefined,
    voteType?: string,
    collectionName?: CollectionNameString,
    collectionNames?: CollectionNameString[],
    after?: string,
    before?: string
  }
}

function tagVotes(terms: VotesViewTerms) {
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
}

function userPostVotes(terms: VotesViewTerms, _: ApolloClient<NormalizedCacheObject>, context?: ResolverContext) {
  const { voteType, collectionName, after, before } = terms;
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
}

function userVotes(terms: VotesViewTerms, _: ApolloClient<NormalizedCacheObject>, context?: ResolverContext) {
  const { collectionNames } = terms;
  const currentUserId = context?.currentUser?._id;
  return {
    selector: {
      collectionName: {$in: collectionNames},
      userId: currentUserId,
      ...(currentUserId ? {authorIds: {$not: currentUserId}} : {}),
      cancelled: {$ne: true},
      isUnvote: {$ne: true},
      // only include neutral votes that have extended vote data
      $or: [
        { voteType: {$ne: "neutral"} },
        { extendedVoteType: {$exists: true} }
      ],
    },
    options: {
      sort: {
        votedAt: -1
      }
    }
  }
}

export const VotesViews = new CollectionViewSet('Votes', {
  tagVotes,
  userPostVotes,
  userVotes
});
