import { ensureIndex } from "../../collectionIndexUtils";
import { TupleSet, UnionOf } from "../../utils/typeGuardUtils";
import ElectionCandidates from "./collection";

const electionCandidateSortOptions = new TupleSet([
  "mostPreVoted",
  "name",
  "recentlyAdded",
] as const);

export const isElectionCandidateSort = (
  value: string,
): value is ElectionCandidatesSort => electionCandidateSortOptions.has(value);

declare global {
  type ElectionCandidatesSort = UnionOf<typeof electionCandidateSortOptions>;

  interface ElectionCandidatesViewTerms extends ViewTermsBase {
    electionName?: string,
    sortBy?: ElectionCandidatesSort,
  }
}

const createSort = (sort?: string) => {
  switch (sort) {
  case "mostPreVoted":
    return {"extendedScore.preVoteCount": -1, createdAt: -1};
  case "name":
    return {name: 1};
  case "recentlyAdded":
    return {createdAt: -1};
  default:
    return {};
  }
}

ElectionCandidates.addDefaultView(({
  electionName,
  sortBy,
}: ElectionCandidatesViewTerms) => {
  return {
    selector: {
      electionName,
      isElectionFundraiser: false,
    },
    options: {
      sort: createSort(sortBy),
    },
  };
});

ensureIndex(ElectionCandidates, {electionName: 1});
