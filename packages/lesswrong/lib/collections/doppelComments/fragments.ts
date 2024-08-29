import { registerFragment } from "@/lib/vulcan-lib";

registerFragment(`
  fragment DoppelCommentsFragment on DoppelComment {
    _id
    commentId
    createdAt
    deleted
    content
  }
`);
