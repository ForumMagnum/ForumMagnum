import { gql } from "@/lib/generated/gql-codegen";

export const ElectionCandidateBasicInfo = gql(`
  fragment ElectionCandidateBasicInfo on ElectionCandidate {
    _id
    electionName
    name
    logoSrc
    href
    fundraiserLink
    gwwcLink
    gwwcId
    description
    tagId
    tag {
      ...TagBasicInfo
    }
    postCount
    baseScore
    score
    extendedScore
    voteCount
    currentUserVote
    currentUserExtendedVote
  }
`)

// For use in the "Other donation opportunities" section at the bottom of the Giving Portal
export const ElectionCandidateSimple = gql(`
  fragment ElectionCandidateSimple on ElectionCandidate {
    _id
    name
    logoSrc
    href
    fundraiserLink
    description
  }
`)

// This fragment has to be fully dereferenced, because the context of vote
// fragments doesn't allow for spreading other fragments
export const WithVoteElectionCandidate = gql(`
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
`)
