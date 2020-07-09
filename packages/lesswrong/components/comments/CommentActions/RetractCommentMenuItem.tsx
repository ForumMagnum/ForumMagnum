import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { Comments } from '../../../lib/collections/comments';
import { useCurrentUser } from '../../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';

const RetractCommentMenuItem = ({comment}: {
  comment: CommentsList,
}) => {
  const currentUser = useCurrentUser();
  const {mutate: updateComment} = useUpdate({
    collection: Comments,
    fragmentName: 'CommentsList',
  });
  
  const handleRetract = (event) => {
    void updateComment({
      selector: {_id: comment._id},
      data: { retracted: true }
    });
  }

  const handleUnretract = (event) => {
    void updateComment({
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

const RetractCommentMenuItemComponent = registerComponent('RetractCommentMenuItem', RetractCommentMenuItem);

declare global {
  interface ComponentTypes {
    RetractCommentMenuItem: typeof RetractCommentMenuItemComponent
  }
}
