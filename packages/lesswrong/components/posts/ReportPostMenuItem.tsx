import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import withDialog from '../common/withDialog'
import ReportOutlinedIcon from '@material-ui/icons/ReportOutlined';
import ListItemIcon from '@material-ui/core/ListItemIcon';

interface ReportPostMenuItemProps extends WithUserProps {
  openDialog: any,
  post: any,
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

(ReportPostMenuItem as any).propTypes = {
  currentUser: PropTypes.object,
  post: PropTypes.object.isRequired
}

const ReportPostMenuItemComponent = registerComponent('ReportPostMenuItem', ReportPostMenuItem, withUser, withDialog);

declare global {
  interface ComponentTypes {
    ReportPostMenuItem: typeof ReportPostMenuItemComponent
  }
}
