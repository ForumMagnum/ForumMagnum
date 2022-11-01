import { registerFragment } from '../../vulcan-lib';

registerFragment(`
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
`);
