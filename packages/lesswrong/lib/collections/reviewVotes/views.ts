import ReviewVotes from "./collection"

declare global {
  interface ReviewVotesViewTerms extends ViewTermsBase {
    view?: ReviewVotesViewName
    postId?: string
    userId?: string
    year?: string,
  }
}


//Messages for a specific conversation
ReviewVotes.addView("reviewVotesFromUser", (terms: ReviewVotesViewTerms) => {
  return {
    selector: {
      userId: terms.userId,
      year: terms.year,
      dummy: false
    }
  };
});

ReviewVotes.addView("reviewVotesForPost", function ({postId}: ReviewVotesViewTerms) {
  return {
    selector: {postId},
  };
});

ReviewVotes.addView("reviewVotesForPostAndUser", function ({postId, userId}: ReviewVotesViewTerms) {
  return {
    selector: {postId, userId}
  };
});

ReviewVotes.addView("reviewVotesAdminDashboard", function ({year}: ReviewVotesViewTerms) {
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
  }
})
