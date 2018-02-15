import React, { PureComponent } from 'react';
import { registerComponent, withMessages } from 'meteor/vulcan:core';
import { MenuItem } from 'material-ui';
import PropTypes from 'prop-types';
import withModerateComment from './withModerateComment.js'
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

class DeleteCommentMenuItem extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  handleDelete = (event) => {
    event.preventDefault();
    if (confirm("Are you sure you want to delete this comment?")) {
      this.props.moderateCommentMutation({
        commentId: this.props.comment._id,
        deleted:true,
      }).then(()=>this.props.flash("Successfully deleted comment", "success")).catch(/* error */);
    }
  }

  handleUndoDelete = (event) => {
    event.preventDefault();
    if (confirm("Are you sure you want to restore this comment?")) {
      this.props.moderateCommentMutation({
        commentId: this.props.comment._id,
        deleted:false
      }).then(()=>this.props.flash("Successfully restored comment", "success")).catch(/* error */);
    }
  }

  render() {
    const modalActions = [
      <span
        className="comment-menu-item-delete-modal-button cancel"
        onTouchTap={()=>{this.setState({open:false})}}>
        Cancel
      </span>,
      <span
        className="comment-menu-item-delete-modal-button cancel"
        onTouchTap={()=>{this.setState({open:false})}}>
        Cancel
      </span>,
      <span
        className="comment-menu-item-delete-modal-button cancel"
        onTouchTap={()=>{this.setState({open:false})}}>
        Cancel
      </span>,
    ]

    if (!this.props.comment.deleted) {
      return <MenuItem className="comment-menu-item-delete" onTouchTap={()=>{this.setState({open:true})}} primaryText="Delete">
        <Dialog
          style={{zIndex:2101}}
          title="Delete Comment"
          actions={modalActions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
        >
          <input id="comment-menu-item-delete-reason"/>
        </Dialog>
      </MenuItem>
    } else if (this.props.comment.deleted) {
      return <MenuItem onTouchTap={ this.handleUndoDelete } primaryText="Undo Delete" />
    }
  }
}

const mutationOptions = {
  fragmentName: "CommentsList"
};

registerComponent('DeleteCommentMenuItem', DeleteCommentMenuItem, [withModerateComment, mutationOptions], withMessages);
export default DeleteCommentMenuItem;
