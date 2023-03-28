import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useCurrentUser } from '../../common/withUser';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { isEAForum } from '../../../lib/instanceSettings';
import ListItemIcon from '@material-ui/core/ListItemIcon';

const styles = (_: ThemeType) => ({
  icon: isEAForum
    ? {fontSize: "18px"}
    : {},
});

const PinToProfileMenuItem = ({ comment, classes }: {
  comment: CommentsList,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { MenuItem } = Components;
  const updateComment = useUpdateComment();

  const togglePinned = async () => {
    await updateComment(comment._id, {
      isPinnedOnProfile: !comment.isPinnedOnProfile
    });
  }
  
  const username = currentUser?._id === comment.userId ? 'my' : `${comment.user?.displayName}'s`

  return <MenuItem onClick={togglePinned}>
    <ListItemIcon>
      <Components.ForumIcon icon="Pin" className={classes.icon} />
    </ListItemIcon>
    {comment.isPinnedOnProfile ? `Unpin from ${username} profile` : `Pin to ${username} profile`}
  </MenuItem>
}

const PinToProfileMenuItemComponent = registerComponent('PinToProfileMenuItem', PinToProfileMenuItem, {styles});

declare global {
  interface ComponentTypes {
    PinToProfileMenuItem: typeof PinToProfileMenuItemComponent
  }
}
