import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import { userCanDo, userOwns } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
// import CheckCircle from '@material-ui/icons/CheckCircle';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';
import ListItemIcon from '@material-ui/core/ListItemIcon';

// TODO: make this actually work
const SubscribeToCommentMenuItem = ({ comment }: {
  comment: CommentsList
}) => {
  const currentUser = useCurrentUser();
  
  if (userCanDo(currentUser, "comments.edit.all") ||
      userOwns(currentUser, comment)) {
        return (
          <MenuItem>
            <ListItemIcon>
              <CheckCircleOutline/>
            </ListItemIcon>
             Subscribe to Thread
          </MenuItem>
        )
  } else {
    return null
  }
}

const SubscribeToCommentMenuItemComponent = registerComponent('SubscribeToCommentMenuItem', SubscribeToCommentMenuItem, {
});

declare global {
  interface ComponentTypes {
    SubscribeToCommentMenuItem: typeof SubscribeToCommentMenuItemComponent
  }
}
