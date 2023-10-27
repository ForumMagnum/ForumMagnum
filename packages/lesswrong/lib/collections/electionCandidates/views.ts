import { ensureIndex } from "../../collectionIndexUtils";
import ElectionCandidates from "./collection";

declare global {
  interface ElectionCandidatesViewTerms extends ViewTermsBase {
    electionName?: string,
  }
}

ElectionCandidates.addDefaultView(({
  electionName,
}: ElectionCandidatesViewTerms) => {
  return {
    selector: {
      electionName,
    },
  };
});

ensureIndex(ElectionCandidates, {electionName: 1});
