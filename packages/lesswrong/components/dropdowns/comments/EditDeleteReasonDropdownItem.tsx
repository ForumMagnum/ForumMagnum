import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { userCanModerateComment } from '../../../lib/collections/users/helpers';
import { useDialog } from '../../common/withDialog';
import { useCurrentUser } from '../../common/withUser';
import { userIsAdminOrMod } from '../../../lib/vulcan-users/permissions';
import EditDeleteReasonDialog from "./EditDeleteReasonDialog";
import DropdownItem from "../DropdownItem";

const EditDeleteReasonDropdownItem = ({comment, post, tag}: {
  comment: CommentsList,
  post?: PostsBase,
  tag?: TagBasicInfo,
}) => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();

  const showEditReasonDialog = () => {
    openDialog({
      name: "EditDeleteReasonDialog",
      contents: ({onClose}) => <EditDeleteReasonDialog
        onClose={onClose}
        comment={comment}
      />
    });
  }

  // Only show this option if:
  // 1. User has permission to moderate this comment
  // 2. The comment is already deleted
  // 3. User is either admin/mod or the person who deleted it
  if (
    !currentUser
    || (!post && !tag)
    || !userCanModerateComment(currentUser, post ?? null, tag ?? null, comment)
    || !comment.deleted
    || !(userIsAdminOrMod(currentUser) || comment.deletedByUserId === currentUser._id)
  ) {
    return null;
  }

  return (
    <DropdownItem
      title="Edit Delete Reason"
      onClick={showEditReasonDialog}
    />
  );
}

export default registerComponent(
  'EditDeleteReasonDropdownItem', EditDeleteReasonDropdownItem,
); 