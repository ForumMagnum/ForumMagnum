import { frag } from "./fragments/fragmentWrapper";

export const SubscribedPostAndCommentsFeed = () => frag`
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
`
