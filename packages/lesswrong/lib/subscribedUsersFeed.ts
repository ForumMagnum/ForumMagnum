import { gql } from "@/lib/generated/gql-codegen/gql";

export const SubscribedPostAndCommentsFeed = gql(`
  fragment SubscribedPostAndCommentsFeed on SubscribedPostAndComments {
    _id
    post {
      ...PostsList
    }
    comments {
      ...CommentsList
    }
    expandCommentIds
    postIsFromSubscribedUser
  }
`)
