import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog'
import ReportOutlinedIcon from '@material-ui/icons/ReportOutlined';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { stickyIcon } from '../../posts/PostsTitle';

const styles = (theme: ThemeType): JssStyles => ({
  sticky: {

  },
})

const PinToProfileMenuItem = ({ comment, classes }: {
  comment: CommentsList,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()

  const { mutate: updateComment } = useUpdate({
    collectionName: "Comments",
    fragmentName: 'CommentsList',
  })

  const togglePinned = async () => {
    await updateComment({
      selector: { _id: comment._id },
      data: {
        isPinnedOnProfile: !comment.isPinnedOnProfile
      },
    })
  }
  
  const username = currentUser?._id === comment.userId ? 'my' : `${comment.user?.displayName}'s`

  return <MenuItem onClick={togglePinned}>
    <ListItemIcon>
      {stickyIcon("MuiSvgIcon-root MuiListItemIcon-root")}
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
