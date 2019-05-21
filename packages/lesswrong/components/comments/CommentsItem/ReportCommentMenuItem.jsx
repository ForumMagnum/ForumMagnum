import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';
import withDialog from '../../common/withDialog'
import Report from '@material-ui/icons/Report';
import ListItemIcon from '@material-ui/core/ListItemIcon';

class ReportCommentMenuItem extends PureComponent {

  showReport = (event) => {
    const { openDialog, comment, currentUser } = this.props;
    
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

    if (!Users.canDo(currentUser, "reports.new")) return null

    return <MenuItem onClick={this.showReport}>
      <ListItemIcon>
        <Report />
      </ListItemIcon>
      Report
    </MenuItem>
  }
}

ReportCommentMenuItem.propTypes = {
  currentUser: PropTypes.object,
  comment: PropTypes.object.isRequired
}

registerComponent('ReportCommentMenuItem', ReportCommentMenuItem, withUser, withDialog);
