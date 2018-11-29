import React, { PureComponent } from 'react';
import { registerComponent, Components, withEdit } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import withUser from '../../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';

class RetractCommentMenuItem extends PureComponent
{
  handleRetract = (event) => {
    const { editMutation, comment } = this.props;
    editMutation({
      documentId: comment._id,
      set: { retracted: true },
    });
  }
  
  handleUnretract = (event) => {
    const { editMutation, comment } = this.props;
    editMutation({
      documentId: comment._id,
      set: { retracted: false },
    });
  }
  
  render() {
    const { currentUser, comment } = this.props;
    
    if (!currentUser || comment.userId != currentUser._id)
      return null;
    
    if (comment.retracted) {
      return <MenuItem onClick={this.handleUnretract}>Unretract Comment</MenuItem>
    } else {
      return <MenuItem onClick={this.handleRetract}>Retract Comment</MenuItem>
    }
  }
}

const withEditOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
}

registerComponent('RetractCommentMenuItem', RetractCommentMenuItem,
  withUser, [withEdit, withEditOptions]);
