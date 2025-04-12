import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useDialog } from '../../common/withDialog';
import { useMutation } from '@apollo/client';
import { userIsAdminOrMod } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import { gql } from '@/lib/generated/gql-codegen/gql';


const LockThreadDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();

  const [unlockThread] = useMutation(gql(`
    mutation unlockThread($commentId: String!) {
      unlockThread(commentId: $commentId)
    }
  `));

  if (!userIsAdminOrMod(currentUser)) {
    return null;
  }

  const handleLockThread = () => {
    openDialog({
      name: "LockThreadDialog",
      contents: ({onClose}) => <Components.LockThreadDialog
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

  const {DropdownItem} = Components;
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

const LockThreadDropdownItemComponent = registerComponent(
  'LockThreadDropdownItem', LockThreadDropdownItem,
);

declare global {
  interface ComponentTypes {
    LockThreadDropdownItem: typeof LockThreadDropdownItemComponent
  }
}
