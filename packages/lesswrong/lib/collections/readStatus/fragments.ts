import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ReadStatusWithPostPage on ReadStatus {
    _id
    userId
    postId
    tagId
    isRead
    lastUpdated
    post {
      ...PostsPage
    }
  }
`);
