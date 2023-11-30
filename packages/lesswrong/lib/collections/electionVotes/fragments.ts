import { registerFragment } from "../../vulcan-lib";

registerFragment(`
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
`);
