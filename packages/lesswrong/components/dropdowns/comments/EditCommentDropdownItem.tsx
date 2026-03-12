import React from 'react';
import { userOwns, userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import DropdownItem from "../DropdownItem";

const EditCommentDropdownItem = ({comment, showEdit}: {
  comment: CommentsList,
  showEdit: () => void,
}) => {
  const currentUser = useCurrentUser();

  if (
    (!userCanDo(currentUser, "comments.edit.all") &&
    !userOwns(currentUser, comment)) ||
    comment.draft
  ) {
    return null;
  }
  return (
    <DropdownItem
      title="Edit"
      onClick={showEdit}
      disabled={!!comment.originalDialogueId}
      tooltip={comment.originalDialogueId ? "Cannot edit dialogue crossposts to shortform" : undefined}
      icon="Edit"
    />
  );
};

export default EditCommentDropdownItem;
