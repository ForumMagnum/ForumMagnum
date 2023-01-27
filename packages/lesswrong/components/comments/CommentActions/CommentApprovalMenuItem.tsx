import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import { userCanDo } from '../../../lib/vulcan-users';
import { useCreate } from '../../../lib/crud/withCreate';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useDialog } from '../../common/withDialog';

interface CommentApproved {
  status: 'approved';
}

interface CommentRejected {
  status: 'rejected';
  rejectionReason?: string;
}

type CommentApprovalAction = CommentApproved | CommentRejected;

export const CommentApprovalMenuItem = ({ comment, currentUser, refetchAfterApproval }: {
  comment: CommentsList,
  currentUser: UsersCurrent,
  refetchAfterApproval?: () => Promise<void>
}) => {
  const { create } = useCreate({
    collectionName: 'CommentApprovals',
    fragmentName: 'CommentApprovalsDefaultFragment'
  });

  const { mutate } = useUpdate({
    collectionName: 'CommentApprovals',
    fragmentName: 'CommentApprovalsDefaultFragment'
  });

  const { openDialog } = useDialog();

  const createCommentApproval = async (approvalAction: CommentApprovalAction) => {
    await create({
      data: {
        commentId: comment._id,
        ...approvalAction
      }
    });
    await refetchAfterApproval?.();
  };

  const updateCommentApproval = async (commentApprovalId: string, approvalAction: CommentApprovalAction) => {
    await mutate({
      selector: { _id: commentApprovalId },
      data: approvalAction
    });
    await refetchAfterApproval?.();
  };

  const approveComment = async () => {
    const approvalAction: CommentApproved = { status: 'approved' };
    if (comment.commentApproval) {
      await updateCommentApproval(comment.commentApproval._id, approvalAction);
    } else {
      await createCommentApproval(approvalAction);
    }
  };

  const rejectComment = async (rejectionReason?: string) => {
    const approvalAction: CommentRejected = { status: 'rejected', rejectionReason };
    if (comment.commentApproval) {
      await updateCommentApproval(comment.commentApproval._id, approvalAction);
    } else {
      await createCommentApproval(approvalAction);
    }
  };

  const openRejectCommentDialog = () => {
    openDialog({
      componentName: 'RejectCommentDialog',
      componentProps: { rejectComment }
    });
  };
 
  if (!userCanDo(currentUser, 'posts.requireCommentApproval.own')) {
    return null;
  }

  const approveCommentMenuItem = (
    <MenuItem onClick={approveComment}>
      Approve
    </MenuItem>
  );

  const rejectCommentMenuItem = (
    <MenuItem onClick={openRejectCommentDialog}>
      Reject
    </MenuItem>
  );

  if (!comment.commentApproval) {
    return <>
      {approveCommentMenuItem}
      {rejectCommentMenuItem}
    </>;
  } else if (comment.commentApproval.status === 'approved') {
    return rejectCommentMenuItem;
  } else {
    return approveCommentMenuItem;
  }
}

const CommentApprovalMenuItemComponent = registerComponent('CommentApprovalMenuItem', CommentApprovalMenuItem);

declare global {
  interface ComponentTypes {
    CommentApprovalMenuItem: typeof CommentApprovalMenuItemComponent
  }
}

