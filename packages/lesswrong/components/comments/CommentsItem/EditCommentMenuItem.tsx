import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import Users from 'meteor/vulcan:users';
import { useCurrentUser } from '../../common/withUser';
import Edit from '@material-ui/icons/Edit';
import ListItemIcon from '@material-ui/core/ListItemIcon';

const EditCommentMenuItem = ({ comment, showEdit }) => {
  const currentUser = useCurrentUser();
  if (Users.canDo(currentUser, "comments.edit.all") ||
      Users.owns(currentUser, comment))
  {
    return (
      <MenuItem onClick={showEdit}>
        <ListItemIcon>
          <Edit />
        </ListItemIcon>
        Edit
      </MenuItem>
    )
  } else {
    return null
  }
};

const EditCommentMenuItemComponent = registerComponent('EditCommentMenuItem', EditCommentMenuItem);

declare global {
  interface ComponentTypes {
    EditCommentMenuItem: typeof EditCommentMenuItemComponent
  }
}
