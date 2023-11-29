import { registerFragment } from "../../vulcan-lib";

registerFragment(`
  fragment ElectionVoteInfo on ElectionVote {
    _id
    electionName
    userId
    vote
    submittedAt
  }
`);
