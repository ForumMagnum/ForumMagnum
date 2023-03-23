import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { useCurrentUser } from '../../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';

const RetractCommentMenuItem = ({comment}: {
  comment: CommentsList,
}) => {
  const currentUser = useCurrentUser();
  const updateComment = useUpdateComment();
  const { MenuItem } = Components;
  
  const handleRetract = (event: React.MouseEvent) => {
    void updateComment(comment._id, {
      retracted: true
    });
  }

  const handleUnretract = (event: React.MouseEvent) => {
    void updateComment(comment._id, {
      retracted: false
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

const RetractCommentMenuItemComponent = registerComponent('RetractCommentMenuItem', RetractCommentMenuItem);

declare global {
  interface ComponentTypes {
    RetractCommentMenuItem: typeof RetractCommentMenuItemComponent
  }
}
