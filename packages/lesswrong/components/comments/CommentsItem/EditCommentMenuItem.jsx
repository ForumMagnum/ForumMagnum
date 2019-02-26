import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';
import Edit from '@material-ui/icons/Edit';
import ListItemIcon from '@material-ui/core/ListItemIcon';

class EditCommentMenuItem extends PureComponent {

  render() {
    const { currentUser, comment, showEdit } = this.props

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
  }
}

EditCommentMenuItem.propTypes = {
  currentUser: PropTypes.object,
  comment: PropTypes.object.isRequired
}

registerComponent('EditCommentMenuItem', EditCommentMenuItem, withUser);
