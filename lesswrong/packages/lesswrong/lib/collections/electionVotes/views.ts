import { ensureIndex } from "../../collectionIndexUtils";
import ElectionVotes from "./collection";

declare global {
  interface ElectionVotesViewTerms extends ViewTermsBase {
    electionName?: string,
    userId?: string,
  }
}

ElectionVotes.addDefaultView(({
  electionName,
  userId,
}: ElectionVotesViewTerms) => {
  return {
    selector: {
      electionName,
      userId,
    },
  };
});

ElectionVotes.addView('allSubmittedVotes', (terms: ElectionVotesViewTerms) => {
  return {
    selector: {
      electionName: terms.electionName,
      submittedAt: {$exists: true},
    },
  };
});

ensureIndex(ElectionVotes, {electionName: 1});
