import { frag } from "@/lib/fragments/fragmentWrapper"

export const ElectionVoteInfo = () => frag`
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
`

export const ElectionVoteRecentDiscussion = () => frag`
  fragment ElectionVoteRecentDiscussion on ElectionVote {
    _id
    electionName
    submittedAt
  }
`
