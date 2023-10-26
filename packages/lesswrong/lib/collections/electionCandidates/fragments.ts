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
