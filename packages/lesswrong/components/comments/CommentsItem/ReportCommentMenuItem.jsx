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
import classNames from 'classnames'

const styles = theme => ({
  icon: {
    color: theme.palette.grey[600]
  },
  disabled: {
    color: theme.palette.grey[400],
    cursor: "default",
  }
})

class ReportCommentMenuItem extends PureComponent {

  showReport = (event) => {
    const { openDialog, comment, currentUser } = this.props;
    if (Users.canDo(currentUser, "reports.new")) {
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
  }

  render() {
    const { currentUser, classes} = this.props

    return <MenuItem onClick={this.showReport} className={classNames({[classes.disabled]: !Users.canDo(currentUser, "reports.new")})}>
      <ListItemIcon>
        <Report className={classNames(classes.icon, {[classes.disabled]: !Users.canDo(currentUser, "reports.new")})}/>
      </ListItemIcon>
      Report
    </MenuItem>
  }
}

ReportCommentMenuItem.propTypes = {
  currentUser: PropTypes.object,
  comment: PropTypes.object.isRequired
}

registerComponent('ReportCommentMenuItem', ReportCommentMenuItem, withUser, withDialog, withStyles(styles, {name: "ReportCommentMenuItem"}));
