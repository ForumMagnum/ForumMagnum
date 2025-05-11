import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useDialog } from '../../common/withDialog';
import { useMutation, gql } from '@apollo/client';
import { userIsAdminOrMod } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import LockThreadDialog from "./LockThreadDialog";
import DropdownItem from "../DropdownItem";

const LockThreadDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();

  const [unlockThread] = useMutation(gql`
    mutation unlockThread($commentId: String!) {
      unlockThread(commentId: $commentId)
    }
  `);

  if (!userIsAdminOrMod(currentUser)) {
    return null;
  }

  const handleLockThread = () => {
    openDialog({
      name: "LockThreadDialog",
      contents: ({onClose}) => <LockThreadDialog
        onClose={onClose}
        commentId={comment._id}
      />
    });
  }

  const handleUnlockThread = async () => {
    await unlockThread({
      variables: {
        commentId: comment._id
      }
    });
    // HACK: The cient-side cache doesn't update to reflect this change, so
    // hard-refresh the page
    window.location.reload();
  }
  if (comment.repliesBlockedUntil) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Unlock Thread")}
        onClick={handleUnlockThread}
      />
    );
  }

  return (
    <DropdownItem
      title={preferredHeadingCase("Lock Thread")}
      onClick={handleLockThread}
    />
  );
}

export default registerComponent(
  'LockThreadDropdownItem', LockThreadDropdownItem,
);


