import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface ReviewVotesViewTerms extends ViewTermsBase {
    view?: ReviewVotesViewName
    postId?: string
    userId?: string
    year?: string,
  }
}

function reviewVotesFromUser(terms: ReviewVotesViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      year: terms.year,
      dummy: false
    }
  };
}

function reviewVotesForPost({postId}: ReviewVotesViewTerms) {
  return {
    selector: {postId},
  };
}

function reviewVotesForPostAndUser({postId, userId}: ReviewVotesViewTerms) {
  return {
    selector: {postId, userId}
  };
}

function reviewVotesAdminDashboard({year}: ReviewVotesViewTerms) {
  return {
    selector: {
      year: year,
      dummy: false
    },
    options: {
      sort: {
        createdAt: -1
      }
    }
  };
}

export const ReviewVotesViews = new CollectionViewSet('ReviewVotes', {
  reviewVotesFromUser,
  reviewVotesForPost,
  reviewVotesForPostAndUser,
  reviewVotesAdminDashboard
});
