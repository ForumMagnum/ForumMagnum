import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useCurrentUser } from '../../common/withUser';
import { Comments } from '../../../lib/collections/comments'
import MenuItem from '@material-ui/core/MenuItem';
import Users from 'meteor/vulcan:users';

const ToggleIsModeratorComment = ({comment}) => {
  const currentUser = useCurrentUser();
  const {mutate: updateComment} = useUpdate({
    collection: Comments,
    fragmentName: "CommentsList",
  });
  
  if (!currentUser || !Users.canDo(currentUser, 'posts.moderate.all')) {
    return null;
  }
  
  const handleMarkAsModeratorComment = (event) => {
    updateComment({
      selector: { _id: comment._id },
      data: { moderatorHat: true }
    });
  }
  const handleUnmarkAsModeratorComment = (event) => {
    updateComment({
      selector: { _id: comment._id },
      data: { moderatorHat: false }
    });
  }
  
  if (comment.moderatorHat) {
    return (
      <MenuItem onClick={handleUnmarkAsModeratorComment}>
        Un-mark as Moderator Comment
      </MenuItem>
    );
  } else {
    return (
      <MenuItem onClick={handleMarkAsModeratorComment}>
        Mark as Moderator Comment
      </MenuItem>
    );
  }
}

registerComponent("ToggleIsModeratorComment", ToggleIsModeratorComment);
