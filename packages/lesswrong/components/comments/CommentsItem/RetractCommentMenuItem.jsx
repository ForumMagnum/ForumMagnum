import React, { PureComponent } from 'react';
import { registerComponent, withEdit } from 'meteor/vulcan:core';
import { Comments } from '../../../lib/collections/comments';
import withUser from '../../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';

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
      return <Tooltip title="Comment will be un-crossed-out, indicating you endorse it again.">
      <MenuItem onClick={this.handleUnretract}>Unretract Comment</MenuItem>
      </Tooltip>
    } else {
      return <Tooltip title="Comment will become crossed out, indicating you no longer endorse it.">
      <MenuItem onClick={this.handleRetract}>Retract Comment</MenuItem>
      </Tooltip>
    }
  }
}

const withEditOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
}

registerComponent('RetractCommentMenuItem', RetractCommentMenuItem,
  withUser, [withEdit, withEditOptions]);
