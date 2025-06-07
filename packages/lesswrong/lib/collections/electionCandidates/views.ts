import { TupleSet, UnionOf } from "../../utils/typeGuardUtils";
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

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
    view: 'default' | undefined,
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

function defaultView(terms: ElectionCandidatesViewTerms) {
  return {
    selector: {
      electionName: terms.electionName,
      isElectionFundraiser: false,
    },
    options: {
      sort: createSort(terms.sortBy),
    },
  };
}

export const ElectionCandidatesViews = new CollectionViewSet('ElectionCandidates', {}, defaultView);
