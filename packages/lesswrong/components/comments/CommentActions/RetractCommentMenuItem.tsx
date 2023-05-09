import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useCurrentUser } from '../../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import { preferredHeadingCase } from '../../../lib/forumTypeUtils';

const RetractCommentMenuItem = ({comment}: {
  comment: CommentsList,
}) => {
  const currentUser = useCurrentUser();
  const {mutate: updateComment} = useUpdate({
    collectionName: "Comments",
    fragmentName: 'CommentsList',
  });
  const { MenuItem } = Components;
  
  const handleRetract = (event: React.MouseEvent) => {
    void updateComment({
      selector: {_id: comment._id},
      data: { retracted: true }
    });
  }

  const handleUnretract = (event: React.MouseEvent) => {
    void updateComment({
      selector: {_id: comment._id},
      data: { retracted: false }
    });
  }

  if (!currentUser || comment.userId != currentUser._id)
    return null;

  if (comment.retracted) {
    return <Tooltip title="Comment will be un-crossed-out, indicating you endorse it again.">
      <MenuItem onClick={handleUnretract}>{preferredHeadingCase("Unretract Comment")}</MenuItem>
    </Tooltip>
  } else {
    return <Tooltip title="Comment will become crossed out, indicating you no longer endorse it.">
    <MenuItem onClick={handleRetract}>{preferredHeadingCase("Retract Comment")}</MenuItem>
    </Tooltip>
  }
}

const RetractCommentMenuItemComponent = registerComponent('RetractCommentMenuItem', RetractCommentMenuItem);

declare global {
  interface ComponentTypes {
    RetractCommentMenuItem: typeof RetractCommentMenuItemComponent
  }
}
