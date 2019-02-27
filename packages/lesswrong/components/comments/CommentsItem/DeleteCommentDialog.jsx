import React, { PureComponent } from 'react';
import { registerComponent, withMessages } from 'meteor/vulcan:core';
import withModerateComment from './withModerateComment.js'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import withDialog from '../../common/withDialog'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  deleteWithoutTrace: {
    marginRight:"auto"
  }
})

class DeleteCommentDialog extends PureComponent {
  state = { deletedReason: "" }

  handleDelete = (event) => {
    const { moderateCommentMutation, onClose, comment, flash } = this.props
    event.preventDefault();
    moderateCommentMutation({
      commentId: comment._id,
      deleted: true,
      deletedPublic: false,
      deletedReason: this.state.deletedReason,
    }).then(()=>{
      flash({messageString: "Successfully deleted comment", type: "success"})
      onClose()
    }).catch(/* error */);
  }

  handleDeletePublic = (event) => {
    const { moderateCommentMutation, onClose, comment, flash } = this.props

    event.preventDefault();
    moderateCommentMutation({
      commentId: comment._id,
      deleted: true,
      deletedPublic: true,
      deletedReason: this.state.deletedReason,
    }).then(()=>{
      flash({messageString: "Successfully deleted comment", type: "success"})
      onClose()
    }).catch(/* error */);
  }

  render() {
    const { onClose, classes } = this.props
    return (
      <Dialog open={true} onClose={onClose}>
        <DialogTitle>
          What is your reason for deleting this comment?
        </DialogTitle>
        <DialogContent>
          <p><em>(If you delete without a trace, the reason will be sent to the author of the comment privately. Otherwise it will be publicly displayed below the comment.)</em></p>
          <br/>
          <TextField
            id="comment-menu-item-delete-reason"
            label="Reason for deleting (optional)"
            className="comments-delete-modal-textfield"
            value={this.state.deletedReason}
            onChange={((event)=> {this.setState({deletedReason:event.target.value})})}
            fullWidth
            multiline
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleDelete} className={classes.deleteWithoutTrace}>
            Delete Without Trace
          </Button>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button color="primary" onClick={this.handleDeletePublic}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

const mutationOptions = {
  fragmentName: "CommentsList"
};

registerComponent('DeleteCommentDialog', DeleteCommentDialog, [withModerateComment, mutationOptions], withMessages, withDialog, withStyles(styles, {name:"DeleteCommentDialog"}));
