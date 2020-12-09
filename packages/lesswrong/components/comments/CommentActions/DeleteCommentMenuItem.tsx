import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useMessages } from '../../common/withMessages';
import MenuItem from '@material-ui/core/MenuItem';
import { userCanModerateComment } from '../../../lib/collections/users/helpers';
import { useModerateComment } from './withModerateComment'
import { useDialog } from '../../common/withDialog'
import { useCurrentUser } from '../../common/withUser';

const DeleteCommentMenuItem = ({comment, post}: {
  comment: CommentsList,
  post: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { flash } = useMessages();
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

  const render = () => {
    if (userCanModerateComment(currentUser, post, comment)) {
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
    } else {
      return null
    }
  }
  return render();
}

const DeleteCommentMenuItemComponent = registerComponent('DeleteCommentMenuItem', DeleteCommentMenuItem);

declare global {
  interface ComponentTypes {
    DeleteCommentMenuItem: typeof DeleteCommentMenuItemComponent
  }
}
