import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Popover from '@material-ui/core/Popover';
import withUser from '../../common/withUser';
import { withTracking } from '../../../lib/analyticsEvents';

const styles = theme => ({
  icon: {
    verticalAlign: 'bottom'
  },
  popper: {
    position: "relative",
    zIndex: theme.zIndexes.postItemMenu
  },
})

class PostsPageActions extends PureComponent {
  state = { anchorEl: null }

  handleClick = (e) => {
    const { anchorEl } = this.state
    const { captureEvent, post } = this.props
    captureEvent("tripleDotClick", {open: true, itemType: "post", postId: post._id})
    this.setState({anchorEl: anchorEl ? null : e.target})
  }

  handleClose = (e) => {
    this.props.captureEvent("tripleDotClick", {open: false, itemType: "post"})
    this.setState({anchorEl: null})
  }

  render() {
    const { classes, post, currentUser, vertical } = this.props 
    const { anchorEl } = this.state 
    const Icon = vertical ? MoreVertIcon : MoreHorizIcon
    
    if (!currentUser) return null;

    return (
      <span>
        <Icon className={classes.icon} onClick={this.handleClick}/> 
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          anchorOrigin={{horizontal: 'left', vertical: 'top'}}
          onClose={this.handleClose}
        >
          <Components.PostActions post={post}/>
        </Popover>
      </span>
    )
  }
}


registerComponent('PostsPageActions', PostsPageActions,
  withStyles(styles, {name: "PostsPageActions"}),
  withUser,
  withTracking
)
