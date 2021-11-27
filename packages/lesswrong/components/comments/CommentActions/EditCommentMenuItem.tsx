import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import { userOwns, userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import Edit from '@material-ui/icons/Edit';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { userHasMinCommentKarma } from '../../../lib/collections/users/helpers';

const EditCommentMenuItem = ({ comment, showEdit }: {
  comment: CommentsList,
  showEdit: ()=>void,
}) => {
  const currentUser = useCurrentUser();
  if (!userCanDo(currentUser, "comments.edit.all") &&
      !userOwns(currentUser, comment)) {
    return null;
  }
  if (!userHasMinCommentKarma(currentUser!)) {
    return null;
  }
  return (
    <MenuItem onClick={showEdit}>
      <ListItemIcon>
        <Edit />
      </ListItemIcon>
      Edit
    </MenuItem>
  )
};

const EditCommentMenuItemComponent = registerComponent('EditCommentMenuItem', EditCommentMenuItem, {});

declare global {
  interface ComponentTypes {
    EditCommentMenuItem: typeof EditCommentMenuItemComponent
  }
}
