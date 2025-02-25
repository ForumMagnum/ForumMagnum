import { registerFragment } from '../../vulcan-lib/fragments';

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
