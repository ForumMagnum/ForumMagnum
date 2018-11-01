import React, { PureComponent } from 'react';
import { registerComponent, withMessages, withUpdate, Components } from 'meteor/vulcan:core';
import MenuItem from 'material-ui/MenuItem';
import PropTypes from 'prop-types';
import { withApollo } from 'react-apollo'
import { Comments } from "../../../lib/collections/comments";

class MoveToAlignmentMenuItem extends PureComponent {

  handleMoveToAlignmentForum = async () => {
    const { comment, updateComment, client, flash, currentUser, } = this.props
    await updateComment({
      selector: { _id: comment._id},
      data: {
        af: true,
        afDate: new Date(),
        moveToAlignmentUserId: currentUser._id
      },
    })
    client.resetStore()
    flash({id:"alignment.move_comment"})
  }

  handleRemoveFromAlignmentForum = async () => {
    const { comment, updateComment, client, flash } = this.props

    await updateComment({
      selector: { _id: comment._id},
      data: {
        af: false,
        afDate: null,
        moveToAlignmentUserId: null
      },
    })

    client.resetStore()
    flash({id:"alignment.remove_comment"})
  }

  render() {
    const { comment } = this.props

    if (!comment.af) {
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

const withUpdateOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
}

registerComponent(
  'MoveToAlignmentMenuItem',
   MoveToAlignmentMenuItem,
   [withUpdate, withUpdateOptions],
   withMessages,
   withApollo,
);
export default MoveToAlignmentMenuItem;
