export const getRejectionDisplayNotice = (commentApproval: CommentApprovalWithoutComment) => {
  const reasonText = commentApproval.rejectionReason ? ` for reason: ${commentApproval.rejectionReason}` : '';
  return `Rejected by ${commentApproval.user.displayName}${reasonText}`;
};
