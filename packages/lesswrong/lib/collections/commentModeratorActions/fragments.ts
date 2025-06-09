import { gql } from "@/lib/generated/gql-codegen";
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
