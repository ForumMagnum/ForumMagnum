import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { userOwns, userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';

const EditCommentDropdownItem = ({comment, showEdit}: {
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

  const {DropdownItem} = Components;
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

const EditCommentDropdownItemComponent = registerComponent(
  'EditCommentDropdownItem',
  EditCommentDropdownItem,
);


declare global {
  interface ComponentTypes {
    EditCommentDropdownItem: typeof EditCommentDropdownItemComponent
  }
}
