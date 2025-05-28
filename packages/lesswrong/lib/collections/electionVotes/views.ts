import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface ElectionVotesViewTerms extends ViewTermsBase {
    view: 'default' | undefined,
    electionName?: string,
    userId?: string,
  }
}

function defaultView(terms: ElectionVotesViewTerms) {
  return {
    selector: {
      electionName: terms.electionName,
      userId: terms.userId,
    },
  };
}

function allSubmittedVotes(terms: ElectionVotesViewTerms) {
  return {
    selector: {
      electionName: terms.electionName,
      submittedAt: {$exists: true},
    },
  };
}

export const ElectionVotesViews = new CollectionViewSet('ElectionVotes', {
  allSubmittedVotes
}, defaultView);

