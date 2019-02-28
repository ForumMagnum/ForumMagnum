import React, { PureComponent } from 'react';
import { registerComponent, withMessages } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import Users from 'meteor/vulcan:users';
import withModerateComment from './withModerateComment.js'
import withDialog from '../../common/withDialog'
import withUser from '../../common/withUser';

class DeleteCommentMenuItem extends PureComponent {

  showDeleteDialog = () => {
    const { openDialog, comment } = this.props;
    openDialog({
      componentName: "DeleteCommentDialog",
      componentProps: {
        comment: comment,
      }
    });
  }

  handleUndoDelete = (event) => {
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
    if (Users.canModeratePost(currentUser, post)) {
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

const mutationOptions = {
  fragmentName: "CommentsList"
};

registerComponent('DeleteCommentMenuItem', DeleteCommentMenuItem, [withModerateComment, mutationOptions], withDialog, withMessages, withUser);
