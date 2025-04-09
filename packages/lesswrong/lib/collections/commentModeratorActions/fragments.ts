import { frag } from "@/lib/fragments/fragmentWrapper";
import { CommentsListWithModerationMetadata } from "../comments/fragments";

export const CommentModeratorActionDisplay = () => gql`
  fragment CommentModeratorActionDisplay on CommentModeratorAction {
    _id
    comment {
      ${CommentsListWithModerationMetadata}
    }
    commentId
    type
    active
    createdAt
    endedAt
  }
`
