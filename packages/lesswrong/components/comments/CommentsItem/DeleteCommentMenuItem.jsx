import React, { PureComponent } from 'react';
import { registerComponent, withMessages } from 'meteor/vulcan:core';
import { MenuItem } from 'material-ui';
import Users from 'meteor/vulcan:users';
import PropTypes from 'prop-types';
import withModerateComment from './withModerateComment.js'

class DeleteCommentMenuItem extends PureComponent {

  constructor(props) {
    super(props);
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
    if (!this.props.comment.deleted) {
      return <MenuItem className="comment-menu-item-delete" onTouchTap={ this.handleDelete } primaryText="Delete" />
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
