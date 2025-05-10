import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { userOwns, userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { DropdownItem } from "../DropdownItem";

const EditCommentDropdownItemInner = ({comment, showEdit}: {
  comment: CommentsList,
  showEdit: () => void,
}) => {
  const currentUser = useCurrentUser();

  if (
    !userCanDo(currentUser, "comments.edit.all") &&
    !userOwns(currentUser, comment)
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

export const EditCommentDropdownItem = registerComponent(
  'EditCommentDropdownItem',
  EditCommentDropdownItemInner,
);



