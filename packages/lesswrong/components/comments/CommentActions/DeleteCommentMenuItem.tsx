import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useMessages } from '../../common/withMessages';
import { userCanModerateComment } from '../../../lib/collections/users/helpers';
import { useModerateComment } from './withModerateComment'
import { useDialog } from '../../common/withDialog'
import { useCurrentUser } from '../../common/withUser';

const DeleteCommentMenuItem = ({comment, post, tag}: {
  comment: CommentsList,
  post?: PostsBase,
  tag?: TagBasicInfo,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { flash } = useMessages();
  const { MenuItem } = Components;
  const { moderateCommentMutation } = useModerateComment({fragmentName: "CommentsList"});
  
  const showDeleteDialog = () => {
    openDialog({
      componentName: "DeleteCommentDialog",
      componentProps: {
        comment: comment,
      }
    });
  }

  const handleUndoDelete = (event: React.MouseEvent) => {
    event.preventDefault();
    void moderateCommentMutation({
      commentId: comment._id,
      deleted:false,
      deletedReason:"",
    }).then(() => flash({messageString: "Successfully restored comment", type: "success"})).catch(/* error */);
  }

  if (!userCanModerateComment(currentUser, post||null, tag||null, comment)) {
    return null;
  }
  
  if (!comment.deleted) {
    return (
      <MenuItem onClick={ showDeleteDialog}>
        Delete
      </MenuItem>
    )
  } else {
    return <MenuItem onClick={ handleUndoDelete }>
      Undo Delete
    </MenuItem>
  }
}

const DeleteCommentMenuItemComponent = registerComponent('DeleteCommentMenuItem', DeleteCommentMenuItem);

declare global {
  interface ComponentTypes {
    DeleteCommentMenuItem: typeof DeleteCommentMenuItemComponent
  }
}
