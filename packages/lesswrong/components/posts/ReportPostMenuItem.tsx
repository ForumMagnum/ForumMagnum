import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog'
import ReportOutlinedIcon from '@material-ui/icons/ReportOutlined';
import ListItemIcon from '@material-ui/core/ListItemIcon';

const ReportPostMenuItem = ({post}: {
  post: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();
  const { MenuItem } = Components;
  
  const showReport = () => {
    if (!currentUser) return;
    
    openDialog({
      componentName: "ReportForm",
      componentProps: {
        postId: post._id,
        link: "/posts/" + post._id,
        userId: currentUser._id,
      }
    });
  }

  if (!userCanDo(currentUser, "reports.new")) return null

  return <MenuItem onClick={showReport}>
    <ListItemIcon>
      <ReportOutlinedIcon />
    </ListItemIcon>
    Report
  </MenuItem>
};

const ReportPostMenuItemComponent = registerComponent('ReportPostMenuItem', ReportPostMenuItem);

declare global {
  interface ComponentTypes {
    ReportPostMenuItem: typeof ReportPostMenuItemComponent
  }
}
