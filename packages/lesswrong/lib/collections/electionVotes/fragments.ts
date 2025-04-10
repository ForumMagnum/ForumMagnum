import { gql } from "@/lib/generated/gql-codegen/gql";

export const ElectionVoteInfo = gql(`
  fragment ElectionVoteInfo on ElectionVote {
    _id
    electionName
    userId
    compareState
    vote
    submittedAt
    submissionComments
    userExplanation
    userOtherComments
  }
`)

export const ElectionVoteRecentDiscussion = gql(`
  fragment ElectionVoteRecentDiscussion on ElectionVote {
    _id
    electionName
    submittedAt
  }
`)
