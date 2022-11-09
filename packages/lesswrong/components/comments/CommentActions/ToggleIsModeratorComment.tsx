import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useCurrentUser } from '../../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';
import { userCanDo } from '../../../lib/vulcan-users/permissions';

const ToggleIsModeratorComment = ({comment}: {
  comment: CommentsList,
}) => {
  const currentUser = useCurrentUser();
  const {mutate: updateComment} = useUpdate({
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });
  
  if (!currentUser || !userCanDo(currentUser, 'posts.moderate.all')) {
    return null;
  }
  
  const handleMarkAsModeratorComment = (modHatVisibility?: { hideModeratorHat: boolean }) => (event: React.MouseEvent) => {
    void updateComment({
      selector: { _id: comment._id },
      data: { moderatorHat: true, ...modHatVisibility }
    });
  }
  const handleUnmarkAsModeratorComment = (event: React.MouseEvent) => {
    void updateComment({
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
      <>
        <MenuItem onClick={handleMarkAsModeratorComment()}>
          Mark as Moderator Comment (visible)
        </MenuItem>
        <MenuItem onClick={handleMarkAsModeratorComment({ hideModeratorHat: true })}>
          Mark as Moderator Comment (invisible)
        </MenuItem>
      </>
    );
  }
}

const ToggleIsModeratorCommentComponent = registerComponent("ToggleIsModeratorComment", ToggleIsModeratorComment);

declare global {
  interface ComponentTypes {
    ToggleIsModeratorComment: typeof ToggleIsModeratorCommentComponent
  }
}
