import React, { PureComponent } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import Users from '../../lib/collections/users/collection';
import withUser from '../common/withUser';
import withDialog from '../common/withDialog'
import ReportOutlinedIcon from '@material-ui/icons/ReportOutlined';
import ListItemIcon from '@material-ui/core/ListItemIcon';

interface ExternalProps {
  post: PostsBase,
}
interface ReportPostMenuItemProps extends ExternalProps, WithUserProps, WithDialogProps {
}

class ReportPostMenuItem extends PureComponent<ReportPostMenuItemProps> {
  showReport = () => {
    const { openDialog, post, currentUser } = this.props;
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

  render() {
    const { currentUser } = this.props;

    if (!Users.canDo(currentUser, "reports.new")) return null

    return <MenuItem onClick={this.showReport}>
      <ListItemIcon>
        <ReportOutlinedIcon />
      </ListItemIcon>
      Report
    </MenuItem>
  }
};

const ReportPostMenuItemComponent = registerComponent<ExternalProps>('ReportPostMenuItem', ReportPostMenuItem, {
  hocs: [withUser, withDialog]
});

declare global {
  interface ComponentTypes {
    ReportPostMenuItem: typeof ReportPostMenuItemComponent
  }
}
