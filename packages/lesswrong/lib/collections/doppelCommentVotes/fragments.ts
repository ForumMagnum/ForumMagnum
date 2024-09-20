import { registerFragment } from "@/lib/vulcan-lib";

registerFragment(`
  fragment DoppelCommentVotesFragment on DoppelCommentVote {
    _id
    userId
    commentId
    type
    doppelCommentChoiceId
    deleted
  }
`);
