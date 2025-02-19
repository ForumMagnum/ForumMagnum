import { getCollectionHooks } from "../mutationCallbacks";

getCollectionHooks("ElectionCandidates").createBefore.add(
  function defaultVotingFields(candidate) {
    candidate.extendedScore ??= {};
    candidate.afBaseScore ??= 0;
    candidate.afExtendedScore ??= {};
    candidate.afVoteCount ??= 0;
    return candidate;
  },
);
