import { registerFragment } from "../../vulcan-lib";

registerFragment(`
  fragment ElectionCandidateBasicInfo on ElectionCandidate {
    _id
    electionName
    name
    logoSrc
    href
    description
    postCount
    baseScore
    score
    extendedScore
    voteCount
    currentUserVote
    currentUserExtendedVote
  }
`);

// This fragment has to be fully dereferenced, because the context of vote
// fragments doesn't allow for spreading other fragments
registerFragment(`
  fragment WithVoteElectionCandidate on ElectionCandidate {
    __typename
    _id
    score
    baseScore
    extendedScore
    afBaseScore
    voteCount
    currentUserVote
    currentUserExtendedVote
  }
`);
