import { frag } from "./fragments/fragmentWrapper";

export const SubscribedPostAndCommentsFeed = () => gql`
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
