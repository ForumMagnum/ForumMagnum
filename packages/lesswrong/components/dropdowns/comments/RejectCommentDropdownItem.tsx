import React from "react";
import { useCurrentUser } from "../../common/withUser";
import { userIsAdminOrMod } from "../../../lib/vulcan-users/permissions";
import DropdownItem from "../DropdownItem";
import { useDialog } from "../../common/withDialog";
import RejectContentDialog from "../../sunshineDashboard/RejectContentDialog";
import { useRejectContent } from "../../hooks/useRejectContent";

const RejectCommentDropdownItem = ({comment, post, tag}: {
  comment: CommentsList,
  post?: PostsDetails,
  tag?: TagBasicInfo,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { rejectContent, unrejectContent, rejectionTemplates } = useRejectContent();

  if (!currentUser || !userIsAdminOrMod(currentUser) || comment.deleted) {
    return null;
  }

  const commentWithParentMetadata = {
    ...comment,
    post: post ?? null,
    tag: tag ?? null,
  };

  const handleReject = () => {
    openDialog({
      name: "RejectContentDialog",
      contents: ({onClose}) => (
        <RejectContentDialog
          rejectionTemplates={rejectionTemplates}
          displayName={comment.user?.displayName}
          rejectContent={(reason) => {
            void rejectContent({
              collectionName: "Comments",
              document: commentWithParentMetadata,
              reason,
            });
          }}
          onClose={onClose}
        />
      ),
    });
  };

  const handleUndoReject = () => {
    void unrejectContent({
      collectionName: "Comments",
      document: commentWithParentMetadata,
    });
  };

  return (
    <DropdownItem
      title={comment.rejected ? "Undo Reject" : "Reject"}
      onClick={comment.rejected ? handleUndoReject : handleReject}
    />
  );
}

export default RejectCommentDropdownItem;
