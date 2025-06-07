import { gql } from "@/lib/crud/wrapGql";

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
