import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useMessages } from '../../common/withMessages';
import { userCanModerateComment } from '../../../lib/collections/users/helpers';
import { useDialog } from '../../common/withDialog'
import { useModerateComment } from '../../comments/CommentActions/withModerateComment';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../lib/forumTypeUtils';

const DeleteCommentDropdownItem = ({comment, post, tag}: {
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
      componentName: "DeleteCommentDialog",
      componentProps: {
        comment: comment,
      },
    });
  }

  const handleUndoDelete = (event: React.MouseEvent) => {
    event.preventDefault();
    void moderateCommentMutation({
      commentId: comment._id,
      deleted:false,
      deletedReason:"",
    }).then(() => flash({
      messageString: "Successfully restored comment",
      type: "success",
    })).catch(/* error */);
  }

  if (
    (!post && !tag) ||
    !userCanModerateComment(currentUser, post ?? null, tag ?? null, comment)
  ) {
    return null;
  }

  const {DropdownItem} = Components;
  if (!comment.deleted) {
    return (
      <DropdownItem
        title="Delete"
        onClick={showDeleteDialog}
      />
    );
  }

  return (
    <DropdownItem
      title={preferredHeadingCase("Undo Delete")}
      onClick={handleUndoDelete}
    />
  );
}

const DeleteCommentDropdownItemComponent = registerComponent(
  'DeleteCommentDropdownItem', DeleteCommentDropdownItem,
);

declare global {
  interface ComponentTypes {
    DeleteCommentDropdownItem: typeof DeleteCommentDropdownItemComponent
  }
}
