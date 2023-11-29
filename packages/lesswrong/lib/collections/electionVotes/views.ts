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

ensureIndex(ElectionVotes, {electionName: 1});
