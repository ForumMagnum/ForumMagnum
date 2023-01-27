import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment CommentApprovalWithoutComment on CommentApproval {
    _id
    user {
      ...UsersMinimumInfo
    }
    status
    rejectionReason
    createdAt
  }
`);
