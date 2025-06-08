import { gql } from "@/lib/crud/wrapGql";
export const CommentModeratorActionDisplay = gql(`
  fragment CommentModeratorActionDisplay on CommentModeratorAction {
    _id
    comment {
      ...CommentsListWithModerationMetadata
    }
    commentId
    type
    active
    createdAt
    endedAt
  }
`)
