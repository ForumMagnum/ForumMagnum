import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useMessages } from '../../common/withMessages';
import { userCanModerateComment } from '../../../lib/collections/users/helpers';
import { useDialog } from '../../common/withDialog'
import { useModerateComment } from './withModerateComment';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import { userIsAdminOrMod } from '../../../lib/vulcan-users/permissions';
import { DeleteCommentDialog } from "./DeleteCommentDialog";
import { DropdownItem } from "../DropdownItem";

const DeleteCommentDropdownItemInner = ({comment, post, tag}: {
  comment: CommentsList,
  post?: PostsBase,
  tag?: TagBasicInfo,
}) => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();
  const {flash} = useMessages();
  const {moderateCommentMutation} = useModerateComment({
    fragmentName: "CommentsList",
  });

  const showDeleteDialog = () => {
    openDialog({
      name: "DeleteCommentDialog",
      contents: ({onClose}) => <DeleteCommentDialog
        onClose={onClose}
        comment={comment}
      />
    });
  }

  const handleUndoDelete = async (event: React.MouseEvent) => {
    event.preventDefault();
    try {
      await moderateCommentMutation({
        commentId: comment._id,
        deleted:false,
        deletedReason:"",
      })
      flash({
        messageString: "Successfully restored comment",
        type: "success",
      });
    } catch(e) {
      flash(e.message);
    }
  }

  if (
    !currentUser
    || (!post && !tag)
    || !userCanModerateComment(currentUser, post ?? null, tag ?? null, comment)
  ) {
    return null;
  }
  if (!comment.deleted) {
    return (
      <DropdownItem
        title="Delete"
        onClick={showDeleteDialog}
      />
    );
  } else if (
    userIsAdminOrMod(currentUser)
    || comment.deletedByUserId === currentUser._id
  ) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Undo Delete")}
        onClick={handleUndoDelete}
      />
    );
  } else {
    return null;
  }
}

export const DeleteCommentDropdownItem = registerComponent(
  'DeleteCommentDropdownItem', DeleteCommentDropdownItemInner,
);


