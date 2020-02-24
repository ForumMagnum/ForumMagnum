import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import Users from '../../../lib/collections/users/collection';
import withUser from '../../common/withUser';
// import CheckCircle from '@material-ui/icons/CheckCircle';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';
import ListItemIcon from '@material-ui/core/ListItemIcon';

// TODO: make this actually work
const SubscribeToCommentMenuItem = ({ currentUser, comment }) => {
  if (Users.canDo(currentUser, "comments.edit.all") ||
      Users.owns(currentUser, comment)) {
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
  hocs: [withUser]
});

declare global {
  interface ComponentTypes {
    SubscribeToCommentMenuItem: typeof SubscribeToCommentMenuItemComponent
  }
}
