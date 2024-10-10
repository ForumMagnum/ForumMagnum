import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useDialog } from '../../common/withDialog';
import { gql } from '@apollo/client';
import { useMutate } from '@/components/hooks/useMutate';
import { userIsAdminOrMod } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../themes/forumTheme';


const LockThreadDropdownItem = ({comment}: {comment: CommentsList}) => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();

  const {mutate} = useMutate();

  if (!userIsAdminOrMod(currentUser)) {
    return null;
  }

  const handleLockThread = () => {
    openDialog({
      componentName: "LockThreadDialog",
      componentProps: {commentId: comment._id},
    });
  }

  const handleUnlockThread = async () => {
    const result = await mutate({
      mutation: gql`
        mutation unlockThread($commentId: String!) {
          unlockThread(commentId: $commentId)
        }
      `,
      variables: {
        commentId: comment._id
      },
      errorHandling: "flashMessageAndReturn",
    });
    if (!result.error) {
      // HACK: The cient-side cache doesn't update to reflect this change, so
      // hard-refresh the page
      window.location.reload();
    }
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
