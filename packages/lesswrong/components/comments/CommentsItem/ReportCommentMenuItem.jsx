import React, { PureComponent } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';
import withDialog from '../../common/withDialog'
import Report from '@material-ui/icons/Report';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  icon: {
    color: theme.palette.grey[600]
  }
})

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
    const { currentUser, classes} = this.props

    if (Users.canDo(currentUser, "reports.new")) {
      return <MenuItem onClick={this.showReport}>
        <ListItemIcon>
          <Report className={classes.icon}/>
        </ListItemIcon>
        Report
      </MenuItem>
    } else {
      return null
    }
  }
}

ReportCommentMenuItem.propTypes = {
  currentUser: PropTypes.object,
  comment: PropTypes.object.isRequired
}

registerComponent('ReportCommentMenuItem', ReportCommentMenuItem, withUser, withDialog, withStyles(styles, {name: "ReportCommentMenuItem"}));
