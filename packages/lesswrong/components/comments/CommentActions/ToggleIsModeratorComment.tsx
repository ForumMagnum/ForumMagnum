import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { useCurrentUser } from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';

const ToggleIsModeratorComment = ({comment}: {
  comment: CommentsList,
}) => {
  const currentUser = useCurrentUser();
  const updateComment = useUpdateComment();
  const { MenuItem } = Components;
  
  if (!currentUser || !userCanDo(currentUser, 'posts.moderate.all')) {
    return null;
  }
  
  const handleMarkAsModeratorComment = (modHatVisibility?: { hideModeratorHat: boolean }) => (event: React.MouseEvent) => {
    void updateComment(comment._id, {
      moderatorHat: true, ...modHatVisibility
    });
  }
  const handleUnmarkAsModeratorComment = (event: React.MouseEvent) => {
    void updateComment(comment._id, {
      moderatorHat: false
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
