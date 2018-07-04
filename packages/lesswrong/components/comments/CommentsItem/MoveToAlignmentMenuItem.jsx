import React, { PureComponent } from 'react';
import { registerComponent, withMessages, Components } from 'meteor/vulcan:core';
import MenuItem from 'material-ui/MenuItem';
import PropTypes from 'prop-types';
import withSetAlignmentComment from '../../alignment-forum/withSetAlignmentComment.jsx'
import { withApollo } from 'react-apollo'

class MoveToAlignmentMenuItem extends PureComponent {

  handleMoveToAlignmentForum = async () => {
    const {
      comment,
      setAlignmentCommentMutation,
      client,
      flash
    } = this.props
    await setAlignmentCommentMutation({
      commentId: comment._id,
      af: true,
    })
    client.resetStore()
    flash({id:"alignment.move_comment"})
  }

  handleRemoveFromAlignmentForum = async () => {
    const {
      comment,
      setAlignmentCommentMutation,
      client,
      flash
    } = this.props
    await setAlignmentCommentMutation({
      commentId: comment._id,
      af: false,
    })
    client.resetStore()
    flash({id:"alignment.remove_comment"})
  }

  render() {
    const { comment } = this.props

    if (!this.props.comment.af) {
      return (
        <MenuItem
          className="comment-menu-item-move-to-alignment"
          onClick={ this.handleMoveToAlignmentForum}
          primaryText="Move to Alignment Forum"
        />
      )
    } else if (comment.af) {
      return <MenuItem
        className="comment-menu-item-remove-from-alignment"
        onClick={ this.handleRemoveFromAlignmentForum }
        primaryText="Remove from Alignment"
      />
    }
  }
}

const mutationOptions = {
  fragmentName: "CommentsList"
};

registerComponent(
  'MoveToAlignmentMenuItem',
   MoveToAlignmentMenuItem,
   [withSetAlignmentComment, mutationOptions],
   withMessages,
   withApollo,
);
export default MoveToAlignmentMenuItem;
