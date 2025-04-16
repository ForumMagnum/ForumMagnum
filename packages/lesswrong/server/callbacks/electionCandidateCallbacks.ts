export function setDefaultVotingFields(candidate: CreateElectionCandidateDataInput & NullablePartial<DbElectionCandidate>) {
  candidate.extendedScore ??= {};
  candidate.afBaseScore ??= 0;
  candidate.afExtendedScore ??= {};
  candidate.afVoteCount ??= 0;
  return candidate;
}
