import { registerFragment } from "./vulcan-lib";

registerFragment(`
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
`);
