import React, { PureComponent } from 'react';
import { registerComponent, withUpdate } from 'meteor/vulcan:core';
import { Comments } from '../../../lib/collections/comments';
import withUser from '../../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';

const RetractCommentMenuItem = ({updateComment, comment, currentUser}) => {
  const handleRetract = (event) => {
    updateComment({
      selector: {_id: comment._id},
      data: { retracted: true }
    });
  }

  const handleUnretract = (event) => {
    updateComment({
      selector: {_id: comment._id},
      data: { retracted: false }
    });
  }

  if (!currentUser || comment.userId != currentUser._id)
    return null;

  if (comment.retracted) {
    return <Tooltip title="Comment will be un-crossed-out, indicating you endorse it again.">
    <MenuItem onClick={handleUnretract}>Unretract Comment</MenuItem>
    </Tooltip>
  } else {
    return <Tooltip title="Comment will become crossed out, indicating you no longer endorse it.">
    <MenuItem onClick={handleRetract}>Retract Comment</MenuItem>
    </Tooltip>
  }
}

registerComponent('RetractCommentMenuItem', RetractCommentMenuItem,
  withUser,
  [withUpdate, {
    collection: Comments,
    fragmentName: 'CommentsList',
  }]
);
