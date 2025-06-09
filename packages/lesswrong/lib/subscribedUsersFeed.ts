import { gql } from "@/lib/generated/gql-codegen";

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
