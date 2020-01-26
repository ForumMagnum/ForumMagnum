import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';
import Edit from '@material-ui/icons/Edit';
import ListItemIcon from '@material-ui/core/ListItemIcon';

const EditCommentMenuItem = ({ currentUser, comment, showEdit }) => {
  if (Users.canDo(currentUser, "comments.edit.all") ||
      Users.owns(currentUser, comment)) {
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

const EditCommentMenuItemComponent = registerComponent('EditCommentMenuItem', EditCommentMenuItem, withUser);

declare global {
  interface ComponentTypes {
    EditCommentMenuItem: typeof EditCommentMenuItemComponent
  }
}
