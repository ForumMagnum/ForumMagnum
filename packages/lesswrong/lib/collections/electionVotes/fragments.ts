export const ElectionVoteInfo = `
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

export const ElectionVoteRecentDiscussion = `
  fragment ElectionVoteRecentDiscussion on ElectionVote {
    _id
    electionName
    submittedAt
  }
`
