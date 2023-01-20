import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { userOwns, userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import Edit from '@material-ui/icons/Edit';
import ListItemIcon from '@material-ui/core/ListItemIcon';

const EditCommentMenuItem = ({ comment, showEdit }: {
  comment: CommentsList,
  showEdit: ()=>void,
}) => {
  const currentUser = useCurrentUser();
  const { MenuItem } = Components;

  if (userCanDo(currentUser, "comments.edit.all") ||
      userOwns(currentUser, comment))
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

const EditCommentMenuItemComponent = registerComponent('EditCommentMenuItem', EditCommentMenuItem, {});

declare global {
  interface ComponentTypes {
    EditCommentMenuItem: typeof EditCommentMenuItemComponent
  }
}
