import React, { PureComponent } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import withUser from '../../common/withUser';
import withDialog from '../../common/withDialog'
import ReportOutlinedIcon from '@material-ui/icons/ReportOutlined';
import ListItemIcon from '@material-ui/core/ListItemIcon';

interface ExternalProps {
  comment: CommentsList,
}
interface ReportCommentMenuItemProps extends ExternalProps, WithUserProps {
  openDialog?: any,
}

class ReportCommentMenuItem extends PureComponent<ReportCommentMenuItemProps,{}> {

  showReport = (event: React.MouseEvent) => {
    const { openDialog, comment, currentUser } = this.props;
    if (!currentUser) return;
    
    openDialog({
      componentName: "ReportForm",
      componentProps: {
        commentId: comment._id,
        postId: comment.postId,
        link: "/posts/" + comment.postId + "/a/" + comment._id,
        userId: currentUser._id,
      }
    });
  }

  render() {
    const { currentUser } = this.props;

    if (!userCanDo(currentUser, "reports.new")) return null

    return <MenuItem onClick={this.showReport}>
      <ListItemIcon>
        <ReportOutlinedIcon />
      </ListItemIcon>
      Report
    </MenuItem>
  }
}

const ReportCommentMenuItemComponent = registerComponent<ExternalProps>('ReportCommentMenuItem', ReportCommentMenuItem, {
  hocs: [withUser, withDialog]
});

declare global {
  interface ComponentTypes {
    ReportCommentMenuItem: typeof ReportCommentMenuItemComponent
  }
}
