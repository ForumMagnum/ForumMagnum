import React, { PureComponent } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { withMessages } from '../../common/withMessages';
import MenuItem from '@material-ui/core/MenuItem';
import { userCanModerateComment } from '../../../lib/collections/users/helpers';
import withModerateComment from './withModerateComment'
import withDialog from '../../common/withDialog'
import withUser from '../../common/withUser';

interface ExternalProps {
  comment: CommentsList,
  post: PostsBase,
}
interface DeleteCommentMenuItemProps extends ExternalProps, WithMessagesProps, WithUserProps {
  openDialog: any,
  moderateCommentMutation: any,
}
class DeleteCommentMenuItem extends PureComponent<DeleteCommentMenuItemProps,{}> {

  showDeleteDialog = () => {
    const { openDialog, comment } = this.props;
    openDialog({
      componentName: "DeleteCommentDialog",
      componentProps: {
        comment: comment,
      }
    });
  }

  handleUndoDelete = (event: React.MouseEvent) => {
    const { moderateCommentMutation, comment, flash } = this.props;
    event.preventDefault();
    moderateCommentMutation({
      commentId: comment._id,
      deleted:false,
      deletedReason:"",
    }).then(() => flash({messageString: "Successfully restored comment", type: "success"})).catch(/* error */);
  }

  render() {
    const { currentUser, comment, post } = this.props
    if (userCanModerateComment(currentUser, post, comment)) {
      if (!comment.deleted) {
        return (
          <MenuItem onClick={ this.showDeleteDialog}>
            Delete
          </MenuItem>
        )
      } else {
        return <MenuItem onClick={ this.handleUndoDelete }>
          Undo Delete
        </MenuItem>
      }
    } else {
      return null
    }
  }
}

const DeleteCommentMenuItemComponent = registerComponent<ExternalProps>(
  'DeleteCommentMenuItem', DeleteCommentMenuItem, {
    hocs: [
      withModerateComment({
        fragmentName: "CommentsList"
      }),
      withDialog, withMessages, withUser
    ]
  }
);

declare global {
  interface ComponentTypes {
    DeleteCommentMenuItem: typeof DeleteCommentMenuItemComponent
  }
}
