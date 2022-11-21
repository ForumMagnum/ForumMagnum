import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment CommentApprovalWithoutComment on CommentApproval {
    _id
    status
    rejectionReason
    createdAt
  }
`);
