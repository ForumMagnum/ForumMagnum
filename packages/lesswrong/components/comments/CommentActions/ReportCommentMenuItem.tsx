import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog'
import ReportOutlinedIcon from '@material-ui/icons/ReportOutlined';
import ListItemIcon from '@material-ui/core/ListItemIcon';

const ReportCommentMenuItem = ({comment}: {
  comment: CommentsList,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  
  const showReport = (event: React.MouseEvent) => {
    if (!currentUser) return;
    
    openDialog({
      componentName: "ReportForm",
      componentProps: {
        commentId: comment._id,
        postId: comment.postId,
        link: "/posts/" + comment.postId + "/a/" + comment._id,
        userId: currentUser._id,
        reportType: 'post'
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
}

const ReportCommentMenuItemComponent = registerComponent('ReportCommentMenuItem', ReportCommentMenuItem);

declare global {
  interface ComponentTypes {
    ReportCommentMenuItem: typeof ReportCommentMenuItemComponent
  }
}
