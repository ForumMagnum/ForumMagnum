import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment CurationNoticesFragment on CurationNotice {
    userId
    user {
      ...UsersMinimumInfo
    }
    commentId
    comment {
      ...CommentsList
    }
    postId
    post {
      ...PostsMinimumInfo
    }
    deleted
    contents {
      ...RevisionEdit
    }
  }
`);
